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
                    branch:branches (id, name),
                    teacher:profiles!classes_teacher_id_fkey (id, full_name, role)
                )
            `)
            .eq('student_id', studentId);
        if (error) throw error;

        const result = data.map(item => {
            const cls = Array.isArray(item.classes) ? item.classes[0] : item.classes;
            return {
                ...cls,
                teacher: Array.isArray(cls.teacher) ? cls.teacher[0] : cls.teacher,
                joinedAt: item.joined_at
            };
        });

        const isProfileMissing = (p) => !p || (Array.isArray(p) && p.length === 0);
        const missingTeacherIds = result.filter(c => isProfileMissing(c.teacher) && c.teacher_id).map(c => c.teacher_id);

        if (missingTeacherIds.length > 0) {
            try {
                const { data: allProfiles, error: rpcError } = await supabase.rpc('get_all_profiles');
                if (!rpcError && allProfiles) {
                    result.forEach(c => {
                        if (isProfileMissing(c.teacher) && c.teacher_id) {
                            const prof = allProfiles.find(p => p.id === c.teacher_id);
                            if (prof) {
                                c.teacher = { id: prof.id, full_name: prof.full_name, role: prof.role, avatar_url: prof.avatar_url };
                            }
                        }
                    });
                }
            } catch (err) { console.error("Failed to fetch missing teachers via RPC:", err); }
        }
        return result;
    },
    async getClassDetails(classId) {
        if (!classId) return null;
        const { data, error } = await supabase
            .from('classes')
            .select(`
                id, name, description, invite_code, created_at, teacher_id, branch_id, subject_id,
                branch:branches (id, name),
                teacher:profiles!classes_teacher_id_fkey (id, full_name, avatar_url)
            `)
            .eq('id', classId)
            .single();
        if (error) throw error;
        if (!data) return null;
        if (Array.isArray(data.teacher)) data.teacher = data.teacher[0];
        const isProfileMissing = (p) => !p || (Array.isArray(p) && p.length === 0);
        if (isProfileMissing(data.teacher) && data.teacher_id) {
            try {
                const { data: allProfiles, error: rpcError } = await supabase.rpc('get_all_profiles');
                if (!rpcError && allProfiles) {
                    const prof = allProfiles.find(p => p.id === data.teacher_id);
                    if (prof) {
                        data.teacher = { id: prof.id, full_name: prof.full_name, role: prof.role, avatar_url: prof.avatar_url };
                    }
                }
            } catch (err) { console.error("Failed to fetch teacher profile via RPC:", err); }
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');
        let start = null;
        if (filters.period && filters.period !== 'all') {
            const now = new Date();
            if (filters.period === 'week') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            else if (filters.period === 'month') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        let query = supabase.from('user_test_results').select('lesson_id, score, is_passed, created_at').eq('user_id', user.id).order('created_at', { ascending: true });
        if (start) query = query.gte('created_at', start.toISOString());
        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) return [];
        let filtered = data;
        if (filters.subjectId) {
            const subjectLessonIds = await this._getSubjectLessonIds(filters.subjectId);
            filtered = data.filter(r => subjectLessonIds.has(r.lesson_id));
        }
        if (filtered.length === 0) return [];
        const groups = {};
        filtered.forEach(r => {
            const d = new Date(r.created_at);
            const key = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!groups[key]) groups[key] = { scores: [], passed: 0, total: 0 };
            groups[key].scores.push(r.score); groups[key].total++; if (r.is_passed) groups[key].passed++;
        });
        return Object.entries(groups).map(([date, g]) => ({ date, avgScore: Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length), passRate: Math.round((g.passed / g.total) * 100), testsCount: g.total }));
    },
    async getMyProgressSummary(selectedSubjects = []) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Пользователь не авторизован');
        const [progressRes, testRes] = await Promise.all([
            supabase.from('user_lesson_progress').select('lesson_id').eq('user_id', user.id),
            supabase.from('user_test_results').select('lesson_id, score').eq('user_id', user.id),
        ]);
        const completedLessons = new Set();
        if (progressRes.data) progressRes.data.forEach(p => completedLessons.add(p.lesson_id));
        if (testRes.data) testRes.data.forEach(t => completedLessons.add(t.lesson_id));
        const scoresByLesson = {};
        if (testRes.data) testRes.data.forEach(t => { if (!scoresByLesson[t.lesson_id]) scoresByLesson[t.lesson_id] = []; scoresByLesson[t.lesson_id].push(t.score); });
        const subjectStats = [];
        let tLA = 0, cLA = 0, allS = [];
        for (const sId of selectedSubjects) {
            try {
                const structure = await syllabusService.getStructure(sId);
                if (!structure?.sections) continue;
                let total = 0, comp = 0, sScores = [];
                for (const sec of structure.sections) for (const top of sec.topics || []) for (const les of top.lessons || []) { total++; if (completedLessons.has(les.id)) comp++; if (scoresByLesson[les.id]) sScores.push(...scoresByLesson[les.id]); }
                tLA += total; cLA += comp; allS.push(...sScores);
                subjectStats.push({ subjectId: sId, totalLessons: total, completedLessons: comp, progress: total > 0 ? Math.round((comp / total) * 100) : 0, avgScore: sScores.length > 0 ? Math.round(sScores.reduce((a, b) => a + b, 0) / sScores.length) : null, testsCount: sScores.length });
            } catch { }
        }
        return { subjects: subjectStats, summary: { totalTests: testRes.data?.length || 0, avgScore: allS.length > 0 ? Math.round(allS.reduce((a, b) => a + b, 0) / allS.length) : 0, bestScore: allS.length > 0 ? Math.max(...allS) : 0, completedLessons: cLA, totalLessons: tLA } };
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
    async getClassSummaryStats(classId, filters = {}) {
        const { period = 'all', studentId = null } = filters;
        const start = getPeriodStartDate(period);
        const { students } = await getClassStudents(classId);
        if (students.length === 0) return { studentsCount: 0, averageTestScore: 0, totalTestsTaken: 0, averageProgress: 0, testsBreakdown: [], passRate: 0 };
        const target = studentId ? [studentId] : students;
        let testQuery = supabase.from('user_test_results').select('*').in('user_id', target);
        if (start) testQuery = testQuery.gte('created_at', start);
        const { data: testResults, error: testsError } = await testQuery;
        if (testsError) return null;
        const { data: lessonProgress } = await supabase.from('user_lesson_progress').select('*').in('user_id', target);
        let totalScore = 0, passedCount = 0; const testsByLesson = {};
        (testResults || []).forEach(tr => {
            totalScore += tr.score || 0; if (tr.is_passed) passedCount++;
            if (!testsByLesson[tr.lesson_id]) testsByLesson[tr.lesson_id] = { totalScore: 0, count: 0, fails: 0, lessonId: tr.lesson_id };
            testsByLesson[tr.lesson_id].totalScore += tr.score || 0; testsByLesson[tr.lesson_id].count += 1; if (!tr.is_passed) testsByLesson[tr.lesson_id].fails += 1;
        });
        const testsLen = (testResults || []).length;
        const testsBreakdown = Object.keys(testsByLesson).map(lId => { const t = testsByLesson[lId]; return { lessonId: lId, averageScore: (t.totalScore / t.count).toFixed(1), failRate: ((t.fails / t.count) * 100).toFixed(1), attemptsCount: t.count }; });
        testsBreakdown.sort((a, b) => Number(a.averageScore) - Number(b.averageScore));
        return { studentsCount: studentId ? 1 : students.length, averageTestScore: testsLen > 0 ? Number((totalScore / testsLen).toFixed(1)) : 0, totalTestsTaken: testsLen, passRate: testsLen > 0 ? Math.round((passedCount / testsLen) * 100) : 0, lessonsOpened: (lessonProgress || []).length, testsBreakdown };
    },
    async getClassTimeDynamics(classId, filters = {}) {
        const { period = 'all', studentId = null } = filters;
        const start = getPeriodStartDate(period);
        const { students } = await getClassStudents(classId);
        if (students.length === 0) return [];
        const target = studentId ? [studentId] : students;
        let query = supabase.from('user_test_results').select('score, created_at, is_passed').in('user_id', target).order('created_at', { ascending: true });
        if (start) query = query.gte('created_at', start);
        const { data, error } = await query;
        if (error || !data || data.length === 0) return [];
        const byDay = {};
        data.forEach(r => {
            const day = new Date(r.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            if (!byDay[day]) byDay[day] = { totalScore: 0, count: 0, passed: 0 };
            byDay[day].totalScore += r.score || 0; byDay[day].count += 1; if (r.is_passed) byDay[day].passed += 1;
        });
        return Object.entries(byDay).map(([date, d]) => ({ date, avgScore: Math.round(d.totalScore / d.count), tests: d.count, passRate: d.count > 0 ? Math.round((d.passed / d.count) * 100) : 0 }));
    },
    async getTopStudents(classId, limit = 5) {
        const { students, members } = await getClassStudents(classId);
        if (students.length === 0) return [];
        const { data: testResults } = await supabase.from('user_test_results').select('user_id, score').in('user_id', students);
        const byStudent = {};
        (testResults || []).forEach(r => { if (!byStudent[r.user_id]) byStudent[r.user_id] = { totalScore: 0, count: 0 }; byStudent[r.user_id].totalScore += r.score || 0; byStudent[r.user_id].count += 1; });
        return Object.entries(byStudent).map(([uId, d]) => { const m = members.find(mem => mem.student_id === uId); return { id: uId, name: m?.profile?.full_name || 'Ученик', avatar: m?.profile?.avatar_url, avgScore: Math.round(d.totalScore / d.count), testsCount: d.count }; }).sort((a, b) => b.avgScore - a.avgScore).slice(0, limit);
    },
    async getCourseProgressStats(classId, totalLessonsInCourse) {
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
        const start = getPeriodStartDate(filters.period || 'all');
        const { students } = await getClassStudents(classId);
        if (students.length === 0) return [];
        let query = supabase.from('user_test_results').select('lesson_id, answers_detail').in('user_id', students).not('answers_detail', 'is', null);
        if (start) query = query.gte('created_at', start);
        const { data } = await query;
        if (!data || data.length === 0) return [];
        const qStats = {};
        data.forEach(res => {
            if (!Array.isArray(res.answers_detail)) return;
            res.answers_detail.forEach(d => {
                const qId = d.question_id; if (!qId) return;
                if (!qStats[qId]) qStats[qId] = { question_id: qId, question_text: d.question_text || 'Неизвестный вопрос', type: d.type || 'unknown', lesson_id: res.lesson_id, total: 0, errors: 0 };
                qStats[qId].total += 1; if (!d.is_correct) qStats[qId].errors += 1;
            });
        });
        return Object.values(qStats).filter(q => q.total >= 2).map(q => ({ ...q, errorRate: Math.round((q.errors / q.total) * 100) })).sort((a, b) => b.errorRate - a.errorRate).slice(0, 15);
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
export const progressService = {
    getLessonStats(lessonId) {
        try {
            const history = JSON.parse(localStorage.getItem(`test_history_${lessonId}`) || '[]');
            if (!history || history.length === 0) return null;
            const totalAttempts = history.length;
            const bestScore = Math.max(...history.map(h => h.score));
            const avgScore = history.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts;
            const avgErrorRate = Math.round(100 - avgScore);
            const lastAttemptAt = history[history.length - 1].timestamp;
            return { totalAttempts, bestScore, avgErrorRate, avgScore, lastAttemptAt };
        } catch (e) {
            console.error('Error parsing lesson stats:', e);
            return null;
        }
    },
    getContainerStats(lessonIds) {
        if (!lessonIds || lessonIds.length === 0) return null;
        let totalAvgScore = 0;
        let completedLessonsCount = 0;
        lessonIds.forEach(id => {
            const stats = this.getLessonStats(id);
            if (stats) {
                totalAvgScore += stats.avgScore;
                completedLessonsCount++;
            }
        });
        if (completedLessonsCount === 0) return null;
        const overallAvgScore = totalAvgScore / completedLessonsCount;
        const avgErrorRate = Math.round(100 - overallAvgScore);
        return {
            completedLessons: completedLessonsCount,
            totalLessons: lessonIds.length,
            avgErrorRate
        };
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
    progressService,
    utilsService,
    cleanUndefined
};
