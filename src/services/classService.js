import { supabase } from './supabase';

export const classService = {
    /**
     * Получить список всех классов для конкретного учителя
     * @param {string} teacherId - ID учителя
     */
    async getTeacherClasses(teacherId) {
        if (!teacherId) return [];

        // 1. Собственные классы (где он создатель)
        const { data: ownedClasses, error: ownedError } = await supabase
            .from('classes')
            .select(`
                id, 
                name, 
                created_at,
                branch_id,
                subject_id,
                branch:branches (id, name),
                class_members (count)
            `)
            .eq('teacher_id', teacherId)
            .order('created_at', { ascending: false });

        if (ownedError) throw ownedError;

        // 2. Классы, где он со-преподаватель
        const { data: coClasses, error: coError } = await supabase
            .from('class_teachers')
            .select(`
                classes (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    branch:branches (id, name),
                    class_members (count)
                )
            `)
            .eq('teacher_id', teacherId);

        if (coError) throw coError;

        // Извлекаем классы из структуры join
        const mappedCoClasses = coClasses.map(item => item.classes).filter(c => c);

        // Объединяем и убираем возможные дубликаты (на всякий случай)
        const allData = [...ownedClasses, ...mappedCoClasses];
        const uniqueData = Array.from(new Map(allData.map(item => [item.id, item])).values());

        // Сортируем по дате создания
        uniqueData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Преобразуем формат count для удобства
        return uniqueData.map(c => ({
            ...c,
            studentsCount: c.class_members?.[0]?.count || 0
        }));
    },

    /**
     * Получить класс, в котором состоит конкретный ученик
     * Ученик может состоять только в одном классе (или в нескольких, но пока выводим списком)
     * @param {string} studentId - ID профиля ученика
     */
    async getStudentClasses(studentId) {
        if (!studentId) return [];

        const { data, error } = await supabase
            .from('class_members')
            .select(`
                joined_at,
                classes!inner (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    branch:branches (id, name),
                    teacher:profiles!classes_teacher_id_fkey (id, full_name, role)
                )
            `)
            .eq('student_id', studentId);

        if (error) throw error;

        return data.map(item => ({
            ...item.classes,
            teacher: item.classes.teacher,
            joinedAt: item.joined_at
        }));
    },

    /**
     * Получить подробную информацию о конкретном классе по ID
     * @param {string} classId - ID класса
     */
    async getClassDetails(classId) {
        if (!classId) return null;

        const { data, error } = await supabase
            .from('classes')
            .select(`
                id, 
                name, 
                description,
                invite_code,
                created_at,
                teacher_id,
                branch_id,
                subject_id,
                branch:branches (id, name),
                teacher:profiles!classes_teacher_id_fkey (id, full_name, avatar_url)
            `)
            .eq('id', classId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Создать новый класс (только для учителей)
     * @param {string} name - Название класса
     * @param {string} teacherId - ID профиля учителя
     * @param {string} branchId - ID филиала (опционально)
     * @param {string} subjectId - ID предмета (опционально)
     */
    async createClass(name, teacherId, branchId = null, subjectId = null) {
        if (!name || !teacherId) throw new Error('Имя класса и ID учителя обязательны');

        const { data, error } = await supabase
            .from('classes')
            .insert([{
                name: name.trim(),
                teacher_id: teacherId,
                branch_id: branchId || null,
                subject_id: subjectId || null
            }])
            .select(`
                *,
                branch:branches (id, name)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Обновить класс (название, филиал, описание, invite code)
     */
    async updateClass(classId, updates) {
        if (!classId || !updates) throw new Error('Некорректные параметры для обновления');

        // Убираем undefined
        const cleanUpdates = Object.entries(updates).reduce((acc, [k, v]) => {
            if (v !== undefined) acc[k] = v;
            return acc;
        }, {});

        const { data, error } = await supabase
            .from('classes')
            .update(cleanUpdates)
            .eq('id', classId)
            .select(`
                id, name, description, invite_code, branch_id, subject_id, branch:branches(id, name)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Вступление в класс по коду приглашения
     */
    async joinClassByCode(userId, code, userRole = 'student') {
        if (!userId || !code) throw new Error('Код приглашения обязателен');

        // Ищем класс по коду
        const { data: cls, error: searchError } = await supabase
            .from('classes')
            .select('id, name')
            .eq('invite_code', code.trim())
            .single();

        if (searchError || !cls) {
            throw new Error('Класс с таким кодом не найден');
        }

        const isTeacher = ['teacher', 'admin', 'super_admin'].includes(userRole);

        if (isTeacher) {
            // Пытаемся добавить как со-преподавателя
            await this.addTeacherToClass(cls.id, userId);
        } else {
            // Пытаемся добавить как ученика
            await this.addStudentToClass(cls.id, userId);
        }

        return cls;
    },

    /**
     * Удалить класс (каскадное удаление уберет учеников из class_members)
     * @param {string} classId - ID класса
     */
    async deleteClass(classId) {
        if (!classId) return false;

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId);

        if (error) throw error;
        return true;
    },

    /**
     * Получить всех учеников конкретного класса
     * @param {string} classId - ID класса
     */
    async getClassMembers(classId) {
        if (!classId) return [];

        const { data, error } = await supabase
            .from('class_members')
            .select(`
                joined_at,
                student:profiles!class_members_student_id_fkey (
                    id, 
                    full_name, 
                    grade, 
                    school
                )
            `)
            .eq('class_id', classId)
            .order('joined_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            joinedAt: item.joined_at,
            ...item.student
        }));
    },

    /**
     * Добавить ученика в класс
     * @param {string} classId - ID класса
     * @param {string} studentId - ID профиля ученика
     */
    async addStudentToClass(classId, studentId) {
        if (!classId || !studentId) throw new Error('ID класса и ученика обязательны');

        // Проверяем, состоит ли он уже в ЭТОМ классе
        const { data: existing, error: checkError } = await supabase
            .from('class_members')
            .select('class_id')
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 - не найдено, это ок
            throw checkError;
        }

        if (existing) {
            throw new Error('Ученик уже состоит в этом классе');
        }

        const { error } = await supabase
            .from('class_members')
            .insert([{ class_id: classId, student_id: studentId }]);

        if (error) throw error;
        return true;
    },

    /**
     * Удалить ученика из класса
     * @param {string} classId - ID класса
     * @param {string} studentId - ID профиля ученика
     */
    async removeStudentFromClass(classId, studentId) {
        if (!classId || !studentId) return false;

        const { error } = await supabase
            .from('class_members')
            .delete()
            .eq('class_id', classId)
            .eq('student_id', studentId);

        if (error) throw error;
        return true;
    },

    /**
     * Глобальный поиск студентов (не учителей), которых нет в данном классе
     * Используется для модалки добавления учеников
     * @param {string} classId - ID класса (для исключения тех кто уже там)
     * @param {string} searchQuery - Строка поиска (email или ФИО)
     */
    async searchAvailableStudents(classId, searchQuery = '') {
        try {
            // 1. Получаем ID всех учеников, которые УЖЕ в классе
            const { data: currentMembers, error: membersError } = await supabase
                .from('class_members')
                .select('student_id')
                .eq('class_id', classId);

            if (membersError) throw membersError;

            const memberIds = currentMembers.map(m => m.student_id);

            // 2. Ищем профили со статусом 'student'
            let query = supabase
                .from('profiles')
                .select('id, full_name, grade, school')
                .eq('role', 'student');

            // 3. Исключаем тех кто уже в классе
            if (memberIds.length > 0) {
                // Not in array (PostgREST syntax workaround: if array is too large, it might fail, 
                // but for normal classes < 1000 users it's fine)
                query = query.not('id', 'in', `(${memberIds.join(',')})`);
            }

            // 4. Фильтруем по поисковой строке
            if (searchQuery && searchQuery.trim().length > 0) {
                const term = `%${searchQuery.trim()}%`;
                query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
            }

            // Ограничиваем выдачу, чтобы не грузить базу
            const { data, error } = await query.limit(50);

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error searching students:', error);
            throw error;
        }
    },

    // ==========================================
    // Управление преподавателями класса
    // ==========================================

    /**
     * Получить всех со-преподавателей класса
     */
    async getClassTeachers(classId) {
        if (!classId) return [];

        const { data, error } = await supabase
            .from('class_teachers')
            .select(`
                added_at,
                teacher:profiles!class_teachers_teacher_id_fkey (
                    id, 
                    full_name, 
                    avatar_url
                )
            `)
            .eq('class_id', classId)
            .order('added_at', { ascending: true });

        if (error) throw error;

        return data.map(item => ({
            addedAt: item.added_at,
            ...item.teacher
        }));
    },

    /**
     * Добавить со-преподавателя в класс
     */
    async addTeacherToClass(classId, teacherId) {
        if (!classId || !teacherId) throw new Error('ID класса и учителя обязательны');

        const { error } = await supabase
            .from('class_teachers')
            .insert([{ class_id: classId, teacher_id: teacherId }]);

        if (error) {
            if (error.code === '23505') throw new Error('Учитель уже добавлен в этот класс');
            throw error;
        }
        return true;
    },

    /**
     * Удалить со-преподавателя из класса
     */
    async removeTeacherFromClass(classId, teacherId) {
        if (!classId || !teacherId) return false;

        const { error } = await supabase
            .from('class_teachers')
            .delete()
            .eq('class_id', classId)
            .eq('teacher_id', teacherId);

        if (error) throw error;
        return true;
    },

    /**
     * Поиск учителей и админов (для добавления в со-преподаватели)
     */
    async searchAvailableTeachers(classId, searchQuery = '') {
        try {
            // 1. Получаем класс, чтобы найти создателя
            const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
            const creatorId = cls?.teacher_id;

            // 2. Получаем текущих со-преподавателей
            const { data: currentTeachers } = await supabase.from('class_teachers').select('teacher_id').eq('class_id', classId);
            const currentIds = (currentTeachers || []).map(t => t.teacher_id);

            if (creatorId) currentIds.push(creatorId);

            // 3. Ищем профили 
            let query = supabase
                .from('profiles')
                .select('id, full_name, role')
                .in('role', ['teacher', 'admin', 'super_admin']);

            // Исключаем текущих
            if (currentIds.length > 0) {
                query = query.not('id', 'in', `(${currentIds.join(',')})`);
            }

            if (searchQuery && searchQuery.trim().length > 0) {
                const term = `%${searchQuery.trim()}%`;
                query = query.ilike('full_name', term);
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching teachers:', error);
            throw error;
        }
    }
};
