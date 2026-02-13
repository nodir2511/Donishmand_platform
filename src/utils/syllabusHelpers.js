import { MOCK_SYLLABUS } from '../constants/syllabus';

/**
 * Найти данные урока и его контекст (тему, раздел, предмет) по ID урока.
 * @param {string} lessonId
 * @returns {{ lesson: object, topic: object, section: object, subjectKey: string, lessonIndex: number, topicIndex: number, sectionIndex: number } | null}
 */
export const findLessonContext = (lessonId) => {
    for (const subjectKey in MOCK_SYLLABUS) {
        const subject = MOCK_SYLLABUS[subjectKey];
        for (let sectionIndex = 0; sectionIndex < subject.sections.length; sectionIndex++) {
            const section = subject.sections[sectionIndex];
            for (let topicIndex = 0; topicIndex < section.topics.length; topicIndex++) {
                const topic = section.topics[topicIndex];
                const lessonIndex = topic.lessons.findIndex(l => l.id === lessonId);
                if (lessonIndex !== -1) {
                    return {
                        lesson: topic.lessons[lessonIndex],
                        topic,
                        section,
                        subjectKey,
                        lessonIndex,
                        topicIndex,
                        sectionIndex
                    };
                }
            }
        }
    }
    return null;
};

/**
 * Получить данные предмета по ID.
 * @param {string} subjectId
 * @returns {object | null}
 */
export const getSubjectData = (subjectId) => MOCK_SYLLABUS[subjectId] || null;

/**
 * Получить данные раздела по ID предмета и ID раздела.
 * @param {string} subjectId
 * @param {string} sectionId
 * @returns {{ section: object, sectionIndex: number } | null}
 */
export const getSectionData = (subjectId, sectionId) => {
    const subject = MOCK_SYLLABUS[subjectId];
    if (!subject) return null;
    const sectionIndex = subject.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return null;
    return { section: subject.sections[sectionIndex], sectionIndex };
};

/**
 * Получить данные темы по ID предмета, раздела и темы.
 * @param {string} subjectId
 * @param {string} sectionId
 * @param {string} topicId
 * @returns {{ topic: object, topicIndex: number, section: object, sectionIndex: number } | null}
 */
export const getTopicData = (subjectId, sectionId, topicId) => {
    const sectionResult = getSectionData(subjectId, sectionId);
    if (!sectionResult) return null;
    const { section, sectionIndex } = sectionResult;
    const topicIndex = section.topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) return null;
    return { topic: section.topics[topicIndex], topicIndex, section, sectionIndex };
};

/**
 * Подсчитать общее количество уроков для предмета.
 * @param {string} subjectId
 * @returns {number}
 */
export const getTotalLessons = (subjectId) => {
    const subject = MOCK_SYLLABUS[subjectId];
    if (!subject) return 0;
    return subject.sections.reduce((acc, section) => {
        return acc + section.topics.reduce((tAcc, topic) => tAcc + topic.lessons.length, 0);
    }, 0);
};
