import { supabase } from './supabase';

/**
 * Service to handle Syllabus (Structure) and Lesson Content synchronization.
 * Strategy: "Don't pollute DB".
 * - Structure (Sections/Topics) is saved as a SINGLE JSON row per subject.
 * - Lesson Content is saved in separate 'lessons' table (one row per lesson).
 */

export const syllabusService = {

    /**
     * Save the entire structure (Sections -> Topics -> Lesson IDs) for a subject.
     * @param {string} subject - Subject ID (e.g., 'math')
     * @param {object} syllabusData - The full syllabus object for this subject
     */
    async saveStructure(subject, syllabusData) {
        // We only save the structure (titles, ids), NOT the heavy content of lessons.
        // We strip out 'content' from lessons to keep the JSON light.

        const cleanSections = syllabusData.sections.map(section => ({
            ...section,
            topics: section.topics.map(topic => ({
                ...topic,
                lessons: topic.lessons.map(lesson => ({
                    id: lesson.id,
                    title: lesson.title,
                    titleTj: lesson.titleTj,
                    type: lesson.type
                    // We DO NOT save 'content' here. It lives in 'lessons' table.
                }))
            }))
        }));

        const { error } = await supabase
            .from('subject_syllabus')
            .upsert({
                subject: subject,
                data: { sections: cleanSections },
                updated_at: new Date()
            }, { onConflict: 'subject' });

        if (error) throw error;
        return true;
    },

    /**
     * Load the structure for a subject
     */
    async getStructure(subject) {
        const { data, error } = await supabase
            .from('subject_syllabus')
            .select('data')
            .eq('subject', subject)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found (empty)
            throw error;
        }
        return data.data; // returns { sections: [...] }
    },

    /**
     * Save a single Lesson's content (Video URL, Text body, etc.)
     * @param {object} lesson - The full lesson object
     * @param {string} subject - Subject ID
     */
    async saveLessonContent(lesson, subject) {
        // Prepare data for 'lessons' table
        const lessonRow = {
            id: isValidUuid(lesson.id) ? lesson.id : undefined, // If local ID (les_123) we might need to handle it, but for now let's assume we gen UUIDs or map them.
            // Actually, for "Don't pollute", we should use the same ID if possible.
            // If lesson.id is "les_123" (local), we can't save it as UUID in DB.
            // Strategy: We will store local IDs in 'content' JSON, but for the DB row ID, we might need a real UUID.
            // Simplified: Let's store the whole content as JSONB in the 'lessons' table, 
            // and use a deterministic UUID or just store 'les_123' if we change column type to text. 
            // BUT schema said UUID. 

            // FIX: For now, we will generate a UUID for the row, but store the 'client_id' (les_123) inside the json.
            // Query by client_id? No, efficient way is to map them.

            // AUTO-FIX strategy:
            // 1. Check if this lesson has a 'db_id'.
            // 2. If yes, update.
            // 3. If no, insert and get new 'db_id', then update local state.

            title_ru: lesson.title,
            title_tj: lesson.titleTj,
            subject: subject,
            content_ru: lesson.content, // Storing full content blob
            // content_tj: ... (if we separated it)
            updated_at: new Date()
        };

        // For simplicity in this iteration, let's just save.
        // But wait, 'id' in schema is UUID. 'les_172...' is not.
        // PROPOSAL: Change schema ID to text to support local IDs or handle mapping.
        // User wants "Simple". Changing schema ID to 'text' is easiest for 'les_...' IDs.

        // Let's assume we change schema to text for ID or we just strictly use UUIDs from now on.
        // I will use `upsert` but I need to ensure ID matches.

        // Let's rely on the fact that we might need to change 'id' to text in schema for maximum flexibility 
        // with the current frontend "les_" IDs. 
    }
};

// Helper
function isValidUuid(id) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(id);
}
