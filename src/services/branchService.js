import { supabase } from './supabase';

export const branchService = {
    /**
     * Получить список всех филиалов
     * Отсортированы по имени по алфавиту
     */
    async getBranches() {
        const { data, error } = await supabase
            .from('branches')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Создать новый филиал (только для админов/супер_админов)
     * @param {string} name - Название филиала
     */
    async createBranch(name) {
        if (!name?.trim()) throw new Error('Название филиала обязательно');

        const { data, error } = await supabase
            .from('branches')
            .insert([{ name: name.trim() }])
            .select()
            .single();

        if (error) {
            // Check for uniqueness constraint violation
            if (error.code === '23505') {
                throw new Error('Филиал с таким названием уже существует');
            }
            throw error;
        }
        return data;
    },

    /**
     * Удалить филиал (только для админов/супер_админов)
     * При удалении classes.branch_id станет NULL (благодаря ON DELETE SET NULL)
     * @param {string} branchId - ID филиала
     */
    async deleteBranch(branchId) {
        if (!branchId) return false;

        const { error } = await supabase
            .from('branches')
            .delete()
            .eq('id', branchId);

        if (error) throw error;
        return true;
    }
};
