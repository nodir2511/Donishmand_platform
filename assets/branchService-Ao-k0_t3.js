import{s as n}from"./index-BecCnk0G.js";import{c as f}from"./cleanUndefined-DcGDzFdA.js";const u={async getTeacherClasses(r){if(!r)return[];const{data:e,error:a}=await n.from("classes").select(`
                id, 
                name, 
                created_at,
                branch_id,
                subject_id,
                branch:branches (id, name),
                class_members (count)
            `).eq("teacher_id",r).order("created_at",{ascending:!1});if(a)throw a;const{data:s,error:i}=await n.from("class_teachers").select(`
                classes (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    branch:branches (id, name),
                    class_members (count)
                )
            `).eq("teacher_id",r);if(i)throw i;const o=s.map(c=>c.classes).filter(c=>c),t=[...e,...o],l=Array.from(new Map(t.map(c=>[c.id,c])).values());return l.sort((c,d)=>new Date(d.created_at)-new Date(c.created_at)),l.map(c=>{var d,h;return{...c,studentsCount:((h=(d=c.class_members)==null?void 0:d[0])==null?void 0:h.count)||0}})},async getStudentClasses(r){if(!r)return[];const{data:e,error:a}=await n.from("class_members").select(`
                joined_at,
                classes!inner (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    teacher_id,
                    branch:branches (id, name),
                    teacher:profiles!classes_teacher_id_fkey (id, full_name, role)
                )
            `).eq("student_id",r);if(a)throw a;const s=e.map(t=>{const l=Array.isArray(t.classes)?t.classes[0]:t.classes;return{...l,teacher:Array.isArray(l.teacher)?l.teacher[0]:l.teacher,joinedAt:t.joined_at}}),i=t=>!t||Array.isArray(t)&&t.length===0;if(s.filter(t=>i(t.teacher)&&t.teacher_id).map(t=>t.teacher_id).length>0)try{const{data:t,error:l}=await n.rpc("get_all_profiles");!l&&t&&s.forEach(c=>{if(i(c.teacher)&&c.teacher_id){const d=t.find(h=>h.id===c.teacher_id);d&&(c.teacher={id:d.id,full_name:d.full_name,role:d.role,avatar_url:d.avatar_url})}})}catch(t){console.error("Failed to fetch missing teachers via RPC:",t)}return s},async getClassDetails(r){if(!r)return null;const{data:e,error:a}=await n.from("classes").select(`
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
            `).eq("id",r).single();if(a)throw a;if(!e)return null;if(Array.isArray(e.teacher)&&(e.teacher=e.teacher[0]),(i=>!i||Array.isArray(i)&&i.length===0)(e.teacher)&&e.teacher_id)try{const{data:i,error:o}=await n.rpc("get_all_profiles");if(!o&&i){const t=i.find(l=>l.id===e.teacher_id);t&&(e.teacher={id:t.id,full_name:t.full_name,role:t.role,avatar_url:t.avatar_url})}}catch(i){console.error("Failed to fetch teacher profile via RPC in getClassDetails:",i)}return e},async createClass(r,e,a=null,s=null){if(!r||!e)throw new Error("Имя класса и ID учителя обязательны");const{data:i,error:o}=await n.from("classes").insert([{name:r.trim(),teacher_id:e,branch_id:a||null,subject_id:s||null}]).select(`
                *,
                branch:branches (id, name)
            `).single();if(o)throw o;return i},async updateClass(r,e){if(!r||!e)throw new Error("Некорректные параметры для обновления");const a=f(e),{data:s,error:i}=await n.from("classes").update(a).eq("id",r).select(`
                id, name, description, invite_code, branch_id, subject_id, branch:branches(id, name)
            `).single();if(i)throw i;return s},async joinClassByCode(r,e,a="student"){if(!r||!e)throw new Error("Код приглашения обязателен");const{data:s,error:i}=await n.from("classes").select("id, name").eq("invite_code",e.trim()).single();if(i||!s)throw new Error("Класс с таким кодом не найден");return["teacher","admin","super_admin"].includes(a)?await this.addTeacherToClass(s.id,r):await this.addStudentToClass(s.id,r),s},async deleteClass(r){if(!r)return!1;const{error:e}=await n.from("classes").delete().eq("id",r);if(e)throw e;return!0},async getClassMembers(r){if(!r)return[];const{data:e,error:a}=await n.from("class_members").select(`
                joined_at,
                student:profiles!class_members_student_id_fkey (
                    id, 
                    full_name, 
                    grade, 
                    school
                )
            `).eq("class_id",r).order("joined_at",{ascending:!1});if(a)throw a;return e.map(s=>({joinedAt:s.joined_at,...s.student}))},async addStudentToClass(r,e){if(!r||!e)throw new Error("ID класса и ученика обязательны");const{data:a,error:s}=await n.from("class_members").select("class_id").eq("class_id",r).eq("student_id",e).single();if(s&&s.code!=="PGRST116")throw s;if(a)throw new Error("Ученик уже состоит в этом классе");const{error:i}=await n.from("class_members").insert([{class_id:r,student_id:e}]);if(i)throw i;return!0},async removeStudentFromClass(r,e){if(!r||!e)return!1;const{error:a}=await n.from("class_members").delete().eq("class_id",r).eq("student_id",e);if(a)throw a;return!0},async searchAvailableStudents(r,e=""){try{const{data:a,error:s}=await n.from("class_members").select("student_id").eq("class_id",r);if(s)throw s;const i=a.map(c=>c.student_id);let o=n.from("profiles").select("id, full_name, grade, school").eq("role","student");if(i.length>0&&(o=o.not("id","in",`(${i.join(",")})`)),e&&e.trim().length>0){const c=`%${e.trim()}%`;o=o.or(`full_name.ilike.${c},email.ilike.${c}`)}const{data:t,error:l}=await o.limit(50);if(l)throw l;return t}catch(a){throw console.error("Error searching students:",a),a}},async getClassTeachers(r){if(!r)return[];const{data:e,error:a}=await n.from("class_teachers").select(`
                added_at,
                teacher:profiles!class_teachers_teacher_id_fkey (
                    id, 
                    full_name, 
                    avatar_url
                )
            `).eq("class_id",r).order("added_at",{ascending:!0});if(a)throw a;return e.map(s=>({addedAt:s.added_at,...s.teacher}))},async addTeacherToClass(r,e){if(!r||!e)throw new Error("ID класса и учителя обязательны");const{error:a}=await n.from("class_teachers").insert([{class_id:r,teacher_id:e}]);if(a)throw a.code==="23505"?new Error("Учитель уже добавлен в этот класс"):a;return!0},async removeTeacherFromClass(r,e){if(!r||!e)return!1;const{error:a}=await n.from("class_teachers").delete().eq("class_id",r).eq("teacher_id",e);if(a)throw a;return!0},async searchAvailableTeachers(r,e=""){try{const{data:a}=await n.from("classes").select("teacher_id").eq("id",r).single(),s=a==null?void 0:a.teacher_id,{data:i}=await n.from("class_teachers").select("teacher_id").eq("class_id",r),o=(i||[]).map(d=>d.teacher_id);s&&o.push(s);let t=n.from("profiles").select("id, full_name, role").in("role",["teacher","admin","super_admin"]);if(o.length>0&&(t=t.not("id","in",`(${o.join(",")})`)),e&&e.trim().length>0){const d=`%${e.trim()}%`;t=t.ilike("full_name",d)}const{data:l,error:c}=await t.limit(20);if(c)throw c;return l}catch(a){throw console.error("Error searching teachers:",a),a}}},w={async getBranches(){const{data:r,error:e}=await n.from("branches").select("id, name").order("name",{ascending:!0});if(e)throw e;return r||[]},async createBranch(r){if(!(r!=null&&r.trim()))throw new Error("Название филиала обязательно");const{data:e,error:a}=await n.from("branches").insert([{name:r.trim()}]).select().single();if(a)throw a.code==="23505"?new Error("Филиал с таким названием уже существует"):a;return e},async deleteBranch(r){if(!r)return!1;const{error:e}=await n.from("branches").delete().eq("id",r);if(e)throw e;return!0}};export{w as b,u as c};
