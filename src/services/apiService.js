import { supabase } from './supabase';
import katex from 'katex';

// ==========================================
// Общие утилиты
// ==========================================

/**
 * Функция для очистки объекта от undefined рекурсивно.
 * Supabase REST API (PostgREST) выдает ошибку 406, если в JSON есть undefined.
 */
export const cleanUndefined = (obj) => {
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    if (obj instanceof Date) return obj;
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
                .map(([k, v]) => [k, cleanUndefined(v)])
        );
    }
    return obj;
};

// ==========================================
// 1. СЕРВИС ФИЛИАЛОВ (branchService)
// ==========================================
export const branchService = {
    async getBranches() {
        const { data, error } = await supabase
            .from('branches')
            .select('id, name')
            .order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async createBranch(name) {
        if (!name?.trim()) throw new Error('Название филиала обязательно');
        const { data, error } = await supabase
            .from('branches')
            .insert([{ name: name.trim() }])
            .select().single();
        if (error) {
            if (error.code === '23505') throw new Error('Филиал с таким названием уже существует');
            throw error;
        }
        return data;
    },
    async deleteBranch(branchId) {
        if (!branchId) return false;
        const { error } = await supabase.from('branches').delete().eq('id', branchId);
        if (error) throw error;
        return true;
    }
};

// ==========================================
// 2. СЕРВИС КЛАССОВ (classService)
// ==========================================
export const classService = {
    async getTeacherClasses(teacherId) {
        if (!teacherId) return [];
        const { data: ownedClasses, error: ownedError } = await supabase
            .from('classes')
            .select(`
                id, name, created_at, branch_id, subject_id,
                branch:branches (id, name),
                class_members (count)
            `)
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });
        if (ownedError) throw ownedError;

        const { data: coClasses, error: coError } = await supabase
            .from('class_teachers')
            .select(`
                classes (
                    id, name, created_at, branch_id, subject_id,
                    branch:branches (id, name),
                    class_members (count)
                )
            `)
            .eq('teacher_id', teacherId);
        if (coError) throw coError;

        const mappedCoClasses = coClasses.map(item => item.classes).filter(c => c);
        const allData = [...ownedClasses, ...mappedCoClasses];
        const uniqueData = Array.from(new Map(allData.map(item => [item.id, item])).values());
        uniqueData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return uniqueData.map(c => ({
            ...c,
            studentsCount: c.class_members?.[0]?.count || 0
        }));
    },
    async getStudentClasses(studentId) {
        if (!studentId) return [];
        const { data, error } = await supabase
            .from('class_members')
            .select(`
                joined_at,
                classes!inner (
                    id, name, created_at, branch_id, subject_id, teacher_id,
                    branch:branches (id, name)
                )
            `)
            .eq('student_id', studentId);
        if (error) throw error;

        let result = data.map(item => {
            const cls = Array.isArray(item.classes) ? item.classes[0] : item.classes;
            return {
                ...cls,
                teacher: { id: cls.teacher_id, full_name: 'Поиск учителя...', role: null },
                joinedAt: item.joined_at
            };
        });

        const teacherIds = [...new Set(result.map(c => c.teacher_id).filter(Boolean))];
        
        if (teacherIds.length > 0) {
            try {
                const { data: profiles, error: pError } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, avatar_url, email')
                    .in('id', teacherIds);
                
                if (!pError && profiles) {
                    result = result.map(c => {
                        let prof = profiles.find(p => p.id === c.teacher_id);
                        if (prof) {
                            // Если имя пустое, пробуем использовать почту или ID
                            if (!prof.full_name?.trim()) {
                                prof.full_name = prof.email?.split('@')[0] || `ID: ${prof.id.substring(0, 8)}`;
                            }
                            return { ...c, teacher: prof };
                        }
                        return c;
                    });
                }
                
                // RPC fallback для скрытых профилей
                const stillMissing = result.some(c => !c.teacher?.full_name?.trim() || c.teacher?.full_name === 'Поиск учителя...');
                if (stillMissing) {
                    const { data: allProfiles, error: rpcError } = await supabase.rpc('get_all_profiles');
                    if (!rpcError && allProfiles) {
                        result = result.map(c => {
                            if (!c.teacher?.full_name?.trim() || c.teacher?.full_name === 'Поиск учителя...') {
                                const prof = allProfiles.find(p => p.id === c.teacher_id);
                                if (prof) {
                                    let name = prof.full_name?.trim() || prof.email?.split('@')[0] || `ID: ${prof.id.substring(0, 8)}`;
                                    return { ...c, teacher: { id: prof.id, full_name: name, role: prof.role, avatar_url: prof.avatar_url } };
                                } else {
                                    // Профиля вообще нет в БД
                                    return { ...c, teacher: { id: c.teacher_id, full_name: `Учитель не найден (ID: ${c.teacher_id.substring(0, 5)}...)`, role: 'unknown' } };
                                }
                            }
                            return c;
                        });
                    } else if (rpcError) {
                        console.error("RPC Fallback Error:", rpcError);
                    }
                }
            } catch (err) { console.error("Failed to fetch teachers:", err); }
        }
        return result;
    },
    async getClassDetails(classId) {
        if (!classId) return null;
        const { data, error } = await supabase
            .from('classes')
            .select(`
                id, name, description, invite_code, created_at, teacher_id, branch_id, subject_id,
                branch:branches (id, name)
            `)
            .eq('id', classId)
            .single();
        if (error) throw error;
        if (!data) return null;
        
        if (data.teacher_id) {
            try {
                const { data: prof, error: pError } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role, email')
                    .eq('id', data.teacher_id)
                    .maybeSingle();
                
                if (!pError && prof && prof.full_name?.trim()) {
                    data.teacher = prof;
                } else if (!pError && prof && !prof.full_name?.trim()) {
                    // Имя пустое, но профиль есть
                    data.teacher = { 
                        ...prof, 
                        full_name: prof.email?.split('@')[0] || `ID: ${prof.id.substring(0, 8)}` 
                    };
                } else {
                    // РПЦ фолбек
                    const { data: allProfiles, error: rpcError } = await supabase.rpc('get_all_profiles');
                    if (!rpcError && allProfiles) {
                        const foundProf = allProfiles.find(p => p.id === data.teacher_id);
                        if (foundProf) {
                            let name = foundProf.full_name?.trim() || foundProf.email?.split('@')[0] || `ID: ${foundProf.id.substring(0, 8)}`;
                            data.teacher = { 
                                id: foundProf.id, 
                                full_name: name, 
                                role: foundProf.role, 
                                avatar_url: foundProf.avatar_url 
                            };
                        } else {
                            data.teacher = { id: data.teacher_id, full_name: `Учитель не найден (ID: ${data.teacher_id.substring(0, 5)}...)`, role: 'unknown' };
                        }
                    }
                }
            } catch (err) { console.error("Failed to fetch teacher profile:", err); }
        }
        return data;
    },
    async createClass(name, teacherId, branchId = null, subjectId = null) {
        if (!name || !teacherId) throw new Error('Имя класса и ID учителя обязательны');
        const { data, error } = await supabase
            .from('classes')
            .insert([{ name: name.trim(), teacher_id: teacherId, branch_id: branchId || null, subject_id: subjectId || null }])
            .select(`*, branch:branches (id, name)`).single();
        if (error) throw error;
        return data;
    },
    async updateClass(classId, updates) {
        if (!classId || !updates) throw new Error('Некорректные параметры для обновления');
        const cleanUpdates = cleanUndefined(updates);
        const { data, error } = await supabase
            .from('classes').update(cleanUpdates).eq('id', classId)
            .select(`id, name, description, invite_code, branch_id, subject_id, branch:branches(id, name)`)
            .single();
        if (error) throw error;
        return data;
    },
    async joinClassByCode(userId, code, userRole = 'student') {
        if (!userId || !code) throw new Error('Код приглашения обязателен');
        const { data: cls, error: searchError } = await supabase
            .from('classes').select('id, name').eq('invite_code', code.trim()).single();
        if (searchError || !cls) throw new Error('Класс с таким кодом не найден');
        const isTeacher = ['teacher', 'admin', 'super_admin'].includes(userRole);
        if (isTeacher) await this.addTeacherToClass(cls.id, userId);
        else await this.addStudentToClass(cls.id, userId);
        return cls;
    },
    async deleteClass(classId) {
        if (!classId) return false;
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) throw error;
        return true;
    },
    async getClassMembers(classId) {
        if (!classId) return [];
        const { data, error } = await supabase
            .from('class_members')
            .select(`joined_at, student:profiles!class_members_student_id_fkey (id, full_name, grade, school)`)
            .eq('class_id', classId)
            .order('joined_at', { ascending: false });
        if (error) throw error;
        return data.map(item => ({ joinedAt: item.joined_at, ...item.student }));
    },
    async addStudentToClass(classId, studentId) {
        if (!classId || !studentId) throw new Error('ID класса и ученика обязательны');
        const { data: existing } = await supabase
            .from('class_members').select('class_id').eq('class_id', classId).eq('student_id', studentId).maybeSingle();
        if (existing) throw new Error('Ученик уже состоит в этом классе');
        const { error } = await supabase.from('class_members').insert([{ class_id: classId, student_id: studentId }]);
        if (error) throw error;
        return true;
    },
    async removeStudentFromClass(classId, studentId) {
        if (!classId || !studentId) return false;
        const { error } = await supabase.from('class_members').delete().eq('class_id', classId).eq('student_id', studentId);
        if (error) throw error;
        return true;
    },
    async searchAvailableStudents(classId, searchQuery = '') {
        const { data: currentMembers } = await supabase.from('class_members').select('student_id').eq('class_id', classId);
        const memberIds = (currentMembers || []).map(m => m.student_id);
        let query = supabase.from('profiles').select('id, full_name, grade, school').eq('role', 'student');
        if (memberIds.length > 0) query = query.not('id', 'in', `(${memberIds.join(',')})`);
        if (searchQuery && searchQuery.trim().length > 0) {
            const term = `%${searchQuery.trim()}%`;
            query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
        }
        const { data, error } = await query.limit(50);
        if (error) throw error;
        return data;
    },
    async getClassTeachers(classId) {
        if (!classId) return [];
        const { data, error } = await supabase
            .from('class_teachers')
            .select(`added_at, teacher:profiles!class_teachers_teacher_id_fkey (id, full_name, avatar_url)`)
            .eq('class_id', classId).order('added_at', { ascending: true });
        if (error) throw error;
        return data.map(item => ({ addedAt: item.added_at, ...item.teacher }));
    },
    async addTeacherToClass(classId, teacherId) {
        if (!classId || !teacherId) throw new Error('ID класса и учителя обязательны');
        const { error } = await supabase.from('class_teachers').insert([{ class_id: classId, teacher_id: teacherId }]);
        if (error) {
            if (error.code === '23505') throw new Error('Учитель уже добавлен в этот класс');
            throw error;
        }
        return true;
    },
    async removeTeacherFromClass(classId, teacherId) {
        if (!classId || !teacherId) return false;
        const { error } = await supabase.from('class_teachers').delete().eq('class_id', classId).eq('teacher_id', teacherId);
        if (error) throw error;
        return true;
    },
    async searchAvailableTeachers(classId, searchQuery = '') {
        const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
        const creatorId = cls?.teacher_id;
        const { data: currentTeachers } = await supabase.from('class_teachers').select('teacher_id').eq('class_id', classId);
        const currentIds = (currentTeachers || []).map(t => t.teacher_id);
        if (creatorId) currentIds.push(creatorId);
        let query = supabase.from('profiles').select('id, full_name, role').in('role', ['teacher', 'admin', 'super_admin']);
        if (currentIds.length > 0) query = query.not('id', 'in', `(${currentIds.join(',')})`);
        if (searchQuery && searchQuery.trim().length > 0) query = query.ilike('full_name', `%${searchQuery.trim()}%`);
        const { data, error } = await query.limit(20);
        if (error) throw error;
        return data;
    },
    async getClassGrades(classId, isStudent, userId) {
        const { students, members } = await getClassStudents(classId);
        const targetIds = isStudent ? [userId] : students;
        if (targetIds.length === 0) return [];
        const filteredMembers = members.filter(m => targetIds.includes(m.student_id));
        return filteredMembers.map(m => ({
            id: m.student_id,
            name: m.profile?.full_name || 'Без имени',
            averageGrade: 0,
            testsPassed: 0
        }));
    }
};

// ==========================================
// 3. СЕРВИС УЧЕБНОГО ПЛАНА (syllabusService)
// ==========================================
const syllabusCache = { structures: {}, lessons: {} };

const splitContent = (content) => {
    if (!content) return { contentRu: null, contentTj: null };
    const splitQuestions = (questions) => {
        if (!questions || !Array.isArray(questions)) return { ru: [], tj: [] };
        const ru = questions.map(q => {
            const base = { id: q.id, type: q.type, image: q.imageRu || q.image, text: q.textRu || '' };
            if (q.type === 'multiple_choice') {
                base.options = (q.options || []).map(opt => ({ id: opt.id, text: opt.textRu || '', image: opt.imageRu || opt.image }));
                base.correctId = q.correctId;
            } else if (q.type === 'matching') {
                base.leftItems = (q.leftItems || []).map(item => ({ id: item.id, text: item.textRu || '', image: item.imageRu || item.image }));
                base.rightItems = (q.rightItems || []).map(item => ({ id: item.id, text: item.textRu || '', image: item.imageRu || item.image }));
                base.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') { base.digits = q.digits; base.unit = q.unit; }
            return base;
        });
        const tj = questions.map(q => {
            const base = { id: q.id, type: q.type, image: q.imageTj || q.imageRu || q.image, text: q.textTj || '' };
            if (q.type === 'multiple_choice') {
                base.options = (q.options || []).map(opt => ({ id: opt.id, text: opt.textTj || '', image: opt.imageTj || opt.imageRu || opt.image }));
                base.correctId = q.correctId;
            } else if (q.type === 'matching') {
                base.leftItems = (q.leftItems || []).map(item => ({ id: item.id, text: item.textTj || '', image: item.imageTj || item.imageRu || item.image }));
                base.rightItems = (q.rightItems || []).map(item => ({ id: item.id, text: item.textTj || '', image: item.imageTj || item.imageRu || item.image }));
                base.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') { base.digits = q.digits; base.unit = q.unit; }
            return base;
        });
        return { ru, tj };
    };
    const { ru: questionsRu, tj: questionsTj } = splitQuestions(content.test?.questions);
    return {
        contentRu: {
            video: { url: content.video?.url || '', description: content.video?.descriptionRu || '' },
            text: { body: content.text?.bodyRu || '' },
            test: { questions: questionsRu },
            slides: content.slidesRu || []
        },
        contentTj: {
            video: { url: content.video?.urlTj || '', description: content.video?.descriptionTj || '' },
            text: { body: content.text?.bodyTj || '' },
            test: { questions: questionsTj },
            slides: content.slidesTj || []
        }
    };
};

const mergeContent = (contentRu, contentTj) => {
    const pickBestText = (qObj) => {
        if (!qObj) return '';
        const variants = [qObj.question, qObj.text, qObj.title];
        for (const v of variants) if (v) return v;
        return '';
    };
    const recoverQuestionTexts = (questions) => {
        if (!questions || !Array.isArray(questions)) return questions;
        return questions.map(q => {
            const recovered = { ...q };
            if (!recovered.textRu) recovered.textRu = pickBestText(q);
            if (!recovered.textTj) {
                const tjVariants = [q.textTj, q.question, q.text, q.title];
                for (const v of tjVariants) if (v && v !== recovered.textRu) { recovered.textTj = v; break; }
            }
            if (recovered.options) recovered.options = recovered.options.map(opt => ({ ...opt, textRu: !opt.textRu ? pickBestText(opt) : opt.textRu, textTj: opt.textTj || '' }));
            if (recovered.leftItems) recovered.leftItems = recovered.leftItems.map(item => ({ ...item, textRu: !item.textRu ? pickBestText(item) : item.textRu, textTj: item.textTj || '' }));
            if (recovered.rightItems) recovered.rightItems = recovered.rightItems.map(item => ({ ...item, textRu: !item.textRu ? pickBestText(item) : item.textRu, textTj: item.textTj || '' }));
            return recovered;
        });
    };
    if (contentRu && (contentRu.slidesRu || contentRu.text?.bodyRu)) {
        if (contentRu.test?.questions) return { ...contentRu, test: { ...contentRu.test, questions: recoverQuestionTexts(contentRu.test.questions) } };
        return contentRu;
    }
    const ru = contentRu || {};
    const tj = contentTj || {};
    const mergeQuestions = (ruQuestions, tjQuestions) => {
        const ruQ = ruQuestions || [];
        const tjQ = tjQuestions || [];
        return ruQ.map((rq, idx) => {
            const tq = tjQ[idx] || {};
            const merged = { id: rq.id, type: rq.type, imageRu: rq.image, imageTj: tq.image, textRu: rq.text || '', textTj: tq.text || '' };
            if (rq.type === 'multiple_choice') {
                merged.options = (rq.options || []).map((opt, optIdx) => {
                    const tOpt = tq.options?.[optIdx] || {};
                    return { id: opt.id, imageRu: opt.image, imageTj: tOpt.image, textRu: opt.text || '', textTj: tOpt.text || '' };
                });
                merged.correctId = rq.correctId;
            } else if (rq.type === 'matching') {
                merged.leftItems = (rq.leftItems || []).map((item, i) => {
                    const tItem = tq.leftItems?.[i] || {};
                    return { id: item.id, imageRu: item.image, imageTj: tItem.image, textRu: item.text || '', textTj: tItem.text || '' };
                });
                merged.rightItems = (rq.rightItems || []).map((item, i) => {
                    const tItem = tq.rightItems?.[i] || {};
                    return { id: item.id, imageRu: item.image, imageTj: tItem.image, textRu: item.text || '', textTj: tItem.text || '' };
                });
                merged.correctMatches = rq.correctMatches;
            } else if (rq.type === 'numeric') { merged.digits = rq.digits; merged.unit = rq.unit; }
            return merged;
        });
    };
    return {
        video: { url: ru.video?.url || '', urlTj: tj.video?.url || '', descriptionRu: ru.video?.description || '', descriptionTj: tj.video?.description || '' },
        text: { bodyRu: ru.text?.body || '', bodyTj: tj.text?.body || '' },
        test: { questions: mergeQuestions(ru.test?.questions, tj.test?.questions) },
        slidesRu: ru.slides || [], slidesTj: tj.slides || []
    };
};

const wrapSingleLangContent = (content, lang) => {
    if (!content) return { video: { url: '', urlTj: '', descriptionRu: '', descriptionTj: '' }, text: { bodyRu: '', bodyTj: '' }, test: { questions: [] }, slidesRu: [], slidesTj: [] };
    const isRu = lang === 'ru';
    const wrapQuestions = (questions) => {
        return (questions || []).map(q => {
            const fallbackText = isRu ? (q.textRu || q.textTj || q.text || '') : (q.textTj || q.textRu || q.text || '');
            const fallbackImage = isRu ? (q.imageRu || q.imageTj || q.image || null) : (q.imageTj || q.imageRu || q.image || null);
            const wrapped = { id: q.id, type: q.type, imageRu: isRu ? fallbackImage : null, imageTj: isRu ? null : fallbackImage, textRu: isRu ? fallbackText : '', textTj: isRu ? '' : fallbackText };
            if (q.type === 'multiple_choice') {
                wrapped.options = (q.options || []).map(opt => {
                    const fText = isRu ? (opt.textRu || opt.textTj || opt.text || '') : (opt.textTj || opt.textRu || opt.text || '');
                    const fImg = isRu ? (opt.imageRu || opt.imageTj || opt.image || null) : (opt.imageTj || opt.imageRu || opt.image || null);
                    return { id: opt.id, imageRu: isRu ? fImg : null, imageTj: isRu ? null : fImg, textRu: isRu ? fText : '', textTj: isRu ? '' : fText };
                });
                wrapped.correctId = q.correctId;
            } else if (q.type === 'matching') {
                wrapped.leftItems = (q.leftItems || []).map(item => {
                    const fText = isRu ? (item.textRu || item.textTj || item.text || '') : (item.textTj || item.textRu || item.text || '');
                    const fImg = isRu ? (item.imageRu || item.imageTj || item.image || null) : (item.imageTj || item.imageRu || item.image || null);
                    return { id: item.id, imageRu: isRu ? fImg : null, imageTj: isRu ? null : fImg, textRu: isRu ? fText : '', textTj: isRu ? '' : fText };
                });
                wrapped.rightItems = (q.rightItems || []).map(item => {
                    const fText = isRu ? (item.textRu || item.textTj || item.text || '') : (item.textTj || item.textRu || item.text || '');
                    const fImg = isRu ? (item.imageRu || item.imageTj || item.image || null) : (item.imageTj || item.imageRu || item.image || null);
                    return { id: item.id, imageRu: isRu ? fImg : null, imageTj: isRu ? null : fImg, textRu: isRu ? fText : '', textTj: isRu ? '' : fText };
                });
                wrapped.correctMatches = q.correctMatches;
            } else if (q.type === 'numeric') { wrapped.digits = q.digits; wrapped.unit = q.unit; }
            return wrapped;
        });
    };
    return {
        video: { url: isRu ? (content.video?.url || '') : '', urlTj: isRu ? '' : (content.video?.url || ''), descriptionRu: isRu ? (content.video?.description || '') : '', descriptionTj: isRu ? '' : (content.video?.description || '') },
        text: { bodyRu: isRu ? (content.text?.body || '') : '', bodyTj: isRu ? '' : (content.text?.body || '') },
        test: { questions: wrapQuestions(content.test?.questions) },
        slidesRu: isRu ? (content.slides || []) : [], slidesTj: isRu ? [] : (content.slides || [])
    };
};

export const syllabusService = {
    invalidateCache(subject) { if (subject) delete syllabusCache.structures[subject]; else { syllabusCache.structures = {}; syllabusCache.lessons = {}; } },
    async saveStructure(subject, syllabusData) {
        const cleanSections = syllabusData.sections.map(section => ({
            id: section.id, title: section.title, titleTj: section.titleTj,
            topics: section.topics.map(topic => ({
                id: topic.id, title: topic.title, titleTj: topic.titleTj,
                lessons: topic.lessons.map(lesson => ({ id: lesson.id, title: lesson.title, titleTj: lesson.titleTj, type: lesson.type }))
            }))
        }));
        const { error } = await supabase.from('subject_syllabus').upsert({ subject, data: { sections: cleanSections }, updated_at: new Date() }, { onConflict: 'subject' });
        if (error) throw error;
        return true;
    },
    async getStructure(subject) {
        if (!subject || subject === 'undefined' || subject === 'null') return null;
        if (syllabusCache.structures[subject]) return syllabusCache.structures[subject];
        const { data, error } = await supabase.from('subject_syllabus').select('data').eq('subject', subject).maybeSingle();
        if (error) throw error;
        if (!data) return null;
        syllabusCache.structures[subject] = data.data;
        return data.data;
    },
    async saveLesson(lesson, subject) {
        const { contentRu, contentTj } = splitContent(lesson.content);
        const payload = cleanUndefined({
            id: lesson.id, title_ru: lesson.title, title_tj: lesson.titleTj,
            subject, content_ru: contentRu, content_tj: contentTj, is_published: true, updated_at: new Date()
        });
        const { error } = await supabase.from('lessons').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        return true;
    },
    async deleteLesson(lessonId) {
        const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
        if (error) throw error;
        return true;
    },
    async deleteLessons(lessonIds) {
        if (!lessonIds || lessonIds.length === 0) return true;
        const { error } = await supabase.from('lessons').delete().in('id', lessonIds);
        if (error) throw error;
        return true;
    },
    async getLesson(lessonId, lang = null) {
        const columns = lang === 'ru' ? 'id, title_ru, title_tj, subject, content_ru' : lang === 'tj' ? 'id, title_ru, title_tj, subject, content_tj' : '*';
        const { data, error } = await supabase.from('lessons').select(columns).eq('id', lessonId).single();
        if (error) { if (error.code === 'PGRST116') return null; throw error; }
        let content = lang ? (wrapSingleLangContent(lang === 'ru' ? data.content_ru : data.content_tj, lang)) : mergeContent(data.content_ru, data.content_tj);
        return { id: data.id, title: data.title_ru, titleTj: data.title_tj, content, subject: data.subject };
    }
};

// ==========================================
// 4. СЕРВИС СТУДЕНТА (studentService)
// ==========================================
export const studentService = {
    async getMyTestHistory(filters = {}) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');
        let query = supabase.from('user_test_results').select('id, lesson_id, score, correct_count, total_questions, is_passed, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            let start;
            if (filters.period === 'week') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (filters.period === 'month') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (start) query = query.gte('created_at', start.toISOString());
        }
        const { data, error } = await query;
        if (error) throw error;
        const lessonIds = [...new Set(data.map(r => r.lesson_id))];
        const lessonNames = await this._getLessonNames(lessonIds);
        const results = data.map(r => ({ ...r, lessonName: lessonNames[r.lesson_id] || 'Тест', errorCount: r.total_questions - r.correct_count }));
        if (filters.subjectId) {
            const subjectLessonIds = await this._getSubjectLessonIds(filters.subjectId);
            return results.filter(r => subjectLessonIds.has(r.lesson_id));
        }
        return results;
    },
    async getMyTimeDynamics(filters = {}) {
        // Рекомендуется использовать getDashboardStats, так как он возвращает dynamics с сервера.
        // Оставляем этот метод для совместимости, но вызываем RPC внутри.
        const stats = await this.getDashboardStats([], filters);
        return stats.dynamics || [];
    },
    async getDashboardStats(selectedSubjects = [], filters = {}) {
        const { period = 'all' } = filters;
        const { data, error } = await supabase.rpc('get_student_dashboard_stats', {
            p_subject_ids: selectedSubjects,
            p_period: period
        });
        if (error) throw error;
        return data;
    },
    async getMyProgressSummary(selectedSubjects = []) {
        // Устаревший метод, заменяем на RPC версию для обратной совместимости
        return this.getDashboardStats(selectedSubjects);
    },
    async changePassword(newPassword) { const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; },
    async updateAvatar(avatarUrl) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');
        const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
        if (error) throw error;
    },
    async updateProfile(userId, updates) {
        if (!userId || !updates) throw new Error('ID пользователя и данные для обновления обязательны');
        const cleanUpdates = cleanUndefined(updates);
        const { data, error } = await supabase.from('profiles').update(cleanUpdates).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    },
    async saveLessonProgress(userId, lessonId, updates) {
        if (!userId || !lessonId) return null;
        const payload = cleanUndefined({
            user_id: userId,
            lesson_id: lessonId,
            ...updates,
            updated_at: new Date()
        });
        const { error } = await supabase.from('user_lesson_progress').upsert(payload, { onConflict: 'user_id,lesson_id' });
        if (error) throw error;
        return true;
    },
    async getLessonProgress(userId, lessonId) {
        if (!userId || !lessonId) return null;
        const { data, error } = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
        if (error) throw error;
        return data;
    },
    async getLessonTestResults(userId, lessonId) {
        if (!userId || !lessonId) return [];
        const { data, error } = await supabase.from('user_test_results').select('*').eq('user_id', userId).eq('lesson_id', lessonId);
        if (error) throw error;
        return data || [];
    },
    async grantXP(amount, reason, subjectId = null, lessonId = null) {
        if (!amount) return null;
        const { data, error } = await supabase.rpc('grant_xp', {
            p_amount: amount,
            p_reason: reason,
            p_subject_id: subjectId,
            p_lesson_id: lessonId
        });
        if (error) throw error;
        return data;
    },
    async refreshStreak() {
        const { data, error } = await supabase.rpc('refresh_user_streak');
        if (error) throw error;
        return data;
    },
    async _getLessonNames(lessonIds) {
        if (!lessonIds.length) return {};
        const { data, error } = await supabase.from('lessons').select('id, title_ru, title_tj').in('id', lessonIds);
        if (error || !data) return {};
        const names = {}; data.forEach(l => names[l.id] = l.title_ru || l.title_tj || l.id);
        return names;
    },
    async _getSubjectLessonIds(subjectId) {
        const ids = new Set();
        try { const structure = await syllabusService.getStructure(subjectId); if (structure?.sections) for (const sec of structure.sections) for (const top of sec.topics || []) for (const les of top.lessons || []) ids.add(les.id); } catch { }
        return ids;
    }
};

// ==========================================
// 5. СЕРВИС СТАТИСТИКИ (statisticsService)
// ==========================================
const getPeriodStartDate = (period) => {
    if (period === 'all' || !period) return null;
    const now = new Date();
    if (period === 'week') now.setDate(now.getDate() - 7);
    else if (period === 'month') now.setMonth(now.getMonth() - 1);
    return now.toISOString();
};

const getClassStudents = async (classId) => {
    const { data: members, error } = await supabase.from('class_members').select(`student_id, profile:profiles!class_members_student_id_fkey (id, full_name, avatar_url, role)`).eq('class_id', classId);
    if (error) return { students: [], members: [] };
    const filtered = (members || []).filter(m => m.profile?.role === 'student' || !m.profile?.role);
    return { students: filtered.map(m => m.student_id), members: filtered };
};

export const statisticsService = {
    async getClassAnalyticsFull(classId, filters = {}) {
        const { period = 'all', studentId = null } = filters;
        const { data, error } = await supabase.rpc('get_class_analytics_stats', {
            p_class_id: classId,
            p_period: period,
            p_student_id: studentId
        });
        if (error) throw error;
        return data;
    },
    async getClassSummaryStats(classId, filters = {}) {
        const data = await this.getClassAnalyticsFull(classId, filters);
        return data;
    },
    async getClassTimeDynamics(classId, filters = {}) {
        const data = await this.getClassAnalyticsFull(classId, filters);
        return data.dynamics || [];
    },
    async getTopStudents(classId, limit = 5) {
        const data = await this.getClassAnalyticsFull(classId);
        return (data.topStudents || []).slice(0, limit);
    },
    async getCourseProgressStats(classId, totalLessonsInCourse) {
        // Используем новый единый RPC вызов для аналитики класса
        const data = await this.getClassAnalyticsFull(classId);
        if (data.courseProgress) {
            return data.courseProgress;
        }
        // Фолбек на старую версию (на случай если RPC не вернул прогресс)
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return { averagePercent: 0, studentsProgress: [] };
        const { data: progress } = await supabase.from('user_lesson_progress').select('user_id, lesson_id').in('user_id', students);
        const byStudent = {}; (progress || []).forEach(p => { if (!byStudent[p.user_id]) byStudent[p.user_id] = new Set(); byStudent[p.user_id].add(p.lesson_id); });
        const total = totalLessonsInCourse || 1; let sumPercent = 0;
        const sProg = members.map(m => { const opened = byStudent[m.student_id]?.size || 0; const percent = Math.min(Math.round((opened / total) * 100), 100); sumPercent += percent; return { id: m.student_id, name: m.profile?.full_name || 'Ученик', opened, total, percent }; });
        sProg.sort((a, b) => b.percent - a.percent);
        return { averagePercent: students.length > 0 ? Math.round(sumPercent / students.length) : 0, studentsProgress: sProg };
    },
    async getStudentsDetailedStats(classId, filters = {}) {
        const start = getPeriodStartDate(filters.period || 'all');
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return [];
        const { data: lessonProgress } = await supabase.from('user_lesson_progress').select('*').in('user_id', students);
        let tQuery = supabase.from('user_test_results').select('*').in('user_id', students).order('created_at', { ascending: false });
        if (start) tQuery = tQuery.gte('created_at', start);
        const { data: testResults } = await tQuery;
        return members.map(m => {
            const sId = m.student_id;
            const sProg = (lessonProgress || []).filter(p => p.user_id === sId);
            const sTests = (testResults || []).filter(t => t.user_id === sId);
            const sum = sTests.reduce((acc, val) => acc + (val.score || 0), 0);
            return { id: sId, name: m.profile?.full_name || 'Неизвестный ученик', avatar: m.profile?.avatar_url, progress: sProg, tests: sTests, averageScore: sTests.length > 0 ? Number((sum / sTests.length).toFixed(1)) : 0, totalTests: sTests.length };
        });
    },
    async getLessonTitlesByIds(lessonIds) {
        if (!lessonIds || lessonIds.length === 0) return {};
        const { data } = await supabase.from('lessons').select('id, title_ru, title_tj').in('id', lessonIds);
        const titles = {}; (data || []).forEach(l => titles[l.id] = l.title_ru || l.title_tj || 'Тест');
        return titles;
    },
    async getDifficultQuestions(classId, filters = {}) {
        const data = await this.getClassAnalyticsFull(classId, filters);
        return data.difficultQuestions || [];
    },
    async getClassLeaderboard(classId, period = 'day') {
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return [];
        let query = supabase.from('coin_transactions').select('user_id, amount, created_at').in('user_id', students);
        const start = getPeriodStartDate(period);
        if (start) query = query.gte('created_at', start);
        const { data: transactions, error } = await query;
        if (error) throw error;
        const userTotals = {};
        (transactions || []).forEach(tx => {
            const uid = tx.user_id;
            if (!userTotals[uid]) userTotals[uid] = { coins: 0, testsCount: 0 };
            userTotals[uid].coins += tx.amount;
            userTotals[uid].testsCount += 1;
        });
        const fullList = members.map(m => ({
            id: m.student_id,
            name: m.profile?.full_name || 'Неизвестный',
            avatar: m.profile?.avatar_url,
            coins: userTotals[m.student_id]?.coins || 0,
            testsCount: userTotals[m.student_id]?.testsCount || 0,
        }));
        fullList.sort((a, b) => b.coins - a.coins || a.name.localeCompare(b.name));
        return fullList;
    },
    async getGlobalLeaderboard(filters = {}) {
        const { period = 'all', subjectId = null, branchId = null } = filters;

        // Преобразуем строковые null/undefined в настоящие null для RPC
        const p_subject_id = (!subjectId || subjectId === 'all') ? null : subjectId;
        const p_branch_text = (!branchId || branchId === 'all') ? null : branchId;

        const { data, error } = await supabase.rpc('get_global_leaderboard', {
            p_subject_id: p_subject_id,
            p_branch_text: p_branch_text,
            p_period: period
        });

        if (error) throw error;
        return data || [];
    }
};

// ==========================================
// 6. СЕРВИС ПЕРЕВОДА (translationService)
// ==========================================
const DICTIONARY = {
    'раздел': 'бахш', 'тема': 'мавзӯъ', 'урок': 'урок', 'тест': 'тест', 'вопрос': 'савол', 'ответ': 'ҷавоб', 'правильный': 'дуруст',
    'неправильный': 'нодуруст', 'введение': 'муқаддима', 'заключение': 'хулоса', 'пример': 'мисол', 'задача': 'масъала',
    'решение': 'ҳал', 'формула': 'формула', 'определение': 'таъриф', 'теорема': 'теорема', 'доказательство': 'исбот',
    'свойство': 'хосият', 'правило': 'қоида', 'упражнение': 'машқ', 'домашнее задание': 'вазифаи хонагӣ',
    'контрольная работа': 'кори назоратӣ', 'глава': 'боб', 'параграф': 'параграф', 'страница': 'саҳифа', 'рисунок': 'расм',
    'таблица': 'ҷадвал', 'график': 'график', 'диаграмма': 'диаграмма', 'число': 'адад', 'цифра': 'рақам', 'сумма': 'ҷамъ',
    'разность': 'тафовут', 'произведение': 'ҳосил', 'частное': 'ҳосили тақсим', 'дробь': 'касрс', 'процент': 'фоиз',
    'уравнение': 'муодила', 'неравенство': 'нобаробарӣ', 'функция': 'функсия', 'переменная': 'тағйирёбанда', 'константа': 'доимӣ',
    'точка': 'нуқта', 'линия': 'хат', 'прямая': 'хати рост', 'отрезок': 'порча', 'луч': 'нимхат', 'угол': 'кунҷ',
    'треугольник': 'секунҷа', 'квадрат': 'мураббаъ', 'прямоугольник': 'росткунҷа', 'круг': 'даврагӣ', 'окружность': 'давра',
    'площадь': 'масоҳат', 'периметр': 'периметр', 'объем': 'ҳаҷм', 'длина': 'дарозӣ', 'ширина': 'паҳнӣ', 'высота': 'баландӣ',
    'математика': 'математика', 'алгебра': 'алгебра', 'геометрия': 'геометрия', 'физика': 'физика', 'химия': 'химия',
    'биология': 'биология', 'история': 'таърих', 'география': 'география', 'литература': 'адабиёт', 'русский язык': 'забони русӣ',
    'таджикский язык': 'забони тоҷикӣ', 'английский язык': 'забони англисӣ', 'информатика': 'информатика'
};
const REVERSE_DICT = Object.entries(DICTIONARY).reduce((acc, [r, t]) => { acc[t] = r; return acc; }, {});

export const translationService = {
    async translateText(text, from = 'ru', to = 'tj') {
        if (!text?.trim()) return '';
        const gTo = to === 'tj' ? 'tg' : to, gFrom = from === 'tj' ? 'tg' : from;
        try {
            const resp = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${gFrom}&tl=${gTo}&dt=t&q=${encodeURIComponent(text)}`);
            const data = await resp.json();
            if (data?.[0]) return data[0].map(i => i[0]).join('');
        } catch (e) { console.warn('Google Translate failed, using dict', e); }
        return this.translateTextSync(text, from, to);
    },
    translateTextSync(text, from = 'ru', to = 'tj') {
        if (!text) return '';
        let res = text.toLowerCase();
        const dict = (from === 'ru' && (to === 'tj' || to === 'tg')) ? DICTIONARY : REVERSE_DICT;
        const entries = Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
        for (const [s, t] of entries) res = res.replace(new RegExp(s, 'gi'), t);
        return res.charAt(0).toUpperCase() + res.slice(1);
    }
};

// ==========================================
// 7. СЕРВИС ХРАНИЛИЩА (storageService)
// ==========================================
export const storageService = {
    async uploadImage(file, bucket = 'images') {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    },
    /**
     * Сжимает изображение до заданных размеров и качества.
     * @param {File} file - Файл изображения.
     * @param {number} maxWidth - Максимальная ширина/высота (px).
     * @param {number} quality - Качество JPEG (0.0 - 1.0).
     * @returns {Promise<string>} - Promise с Base64 строкой.
     */
    async compressImage(file, maxWidth = 1600, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxWidth) {
                            width = Math.round((width * maxWidth) / height);
                            height = maxWidth;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };

                img.onerror = (error) => reject(error);
            };

            reader.onerror = (error) => reject(error);
        });
    }
};

// ==========================================
// 8. УТИЛИТЫ И ПОМОЩНИКИ (utils)
// ==========================================
export const utilsService = {
    /**
     * Сжимает изображение до заданных размеров и качества.
     * @deprecated Используйте storageService.compressImage
     */
    compressImage: storageService.compressImage,

    /**
     * Перемешивает массив случайным образом (Алгоритм Фишера-Йетса)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Обрабатывает HTML-строку, находит формулы KaTeX и заменяет их на HTML.
     */
    renderKatex(html) {
        if (!html || typeof html !== 'string') return html;
        let result = html.replace(/\$\$([^$]+?)\$\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                console.warn('Ошибка рендеринга KaTeX:', e);
                return match;
            }
        });
        result = result.replace(/\$([^$]+?)\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula.trim(), {
                    displayMode: false,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                console.warn('Ошибка рендеринга KaTeX:', e);
                return match;
            }
        });
        return result;
    }
};

// ==========================================
// 9. ПРОГРЕСС И ЛОКАЛЬНОЕ ХРАНИЛИЩЕ (progressService)
// ==========================================
// Очищено: progressService удален, так как статистика теперь рассчитывается на сервере.

// ==========================================
// 10. СЕРВИС ОЦЕНИВАНИЯ (tripleGradingService)
// ==========================================
export const tripleGradingService = {
    /**
     * Запрашивает предварительный расчет оценок у БД
     */
    async calculateSystemGrades(classId, topicId, lessonIds) {
        if (!classId || !topicId || !lessonIds?.length) return [];
        const { data, error } = await supabase.rpc('calculate_system_grades', {
            p_class_id: classId,
            p_topic_id: topicId,
            p_lesson_ids: lessonIds
        });
        if (error) throw error;
        return data || [];
    },

    /**
     * Массовое сохранение оценок за тему для всего класса
     */
    async saveTopicGrades(classId, topicId, gradesArray) {
        if (!classId || !topicId || !gradesArray?.length) return false;
        
        // Очищаем от возможных undefined, так как RPC упадет с 406
        const cleanArray = cleanUndefined(gradesArray);
        
        const { error } = await supabase.rpc('save_topic_grades', {
            p_class_id: classId,
            p_topic_id: topicId,
            p_grades_array: cleanArray
        });
        if (error) throw error;
        return true;
    },

    /**
     * Получает общую матрицу всех сохраненных оценок класса
     */
    async getTripleGradesMatrix(classId) {
        if (!classId) return [];
        const { data, error } = await supabase.rpc('get_topic_grades_matrix', {
            p_class_id: classId
        });
        if (error) throw error;
        return data || [];
    }
};

// Единый экспорт для удобства
export default {
    branchService,
    classService,
    syllabusService,
    studentService,
    statisticsService,
    translationService,
    storageService,
    utilsService,
    tripleGradingService,
    cleanUndefined
};
