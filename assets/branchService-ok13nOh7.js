import{s as n}from"./index-DJH5AWD4.js";import{c as f}from"./cleanUndefined-DcGDzFdA.js";const u={async getTeacherClasses(e){if(!e)return[];const{data:r,error:a}=await n.from("classes").select(`
                id, 
                name, 
                created_at,
                branch_id,
                subject_id,
                branch:branches (id, name),
                class_members (count)
            `).eq("teacher_id",e).order("created_at",{ascending:!1});if(a)throw a;const{data:t,error:c}=await n.from("class_teachers").select(`
                classes (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    branch:branches (id, name),
                    class_members (count)
                )
            `).eq("teacher_id",e);if(c)throw c;const s=t.map(i=>i.classes).filter(i=>i),l=[...r,...s],o=Array.from(new Map(l.map(i=>[i.id,i])).values());return o.sort((i,d)=>new Date(d.created_at)-new Date(i.created_at)),o.map(i=>{var d,h;return{...i,studentsCount:((h=(d=i.class_members)==null?void 0:d[0])==null?void 0:h.count)||0}})},async getStudentClasses(e){if(!e)return[];const{data:r,error:a}=await n.from("class_members").select(`
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
            `).eq("student_id",e);if(a)throw a;const t=r.map(s=>({...s.classes,teacher:s.classes.teacher,joinedAt:s.joined_at}));if(t.filter(s=>!s.teacher&&s.teacher_id).map(s=>s.teacher_id).length>0)try{const{data:s,error:l}=await n.rpc("get_all_profiles");!l&&s&&t.forEach(o=>{if(!o.teacher&&o.teacher_id){const i=s.find(d=>d.id===o.teacher_id);i&&(o.teacher={id:i.id,full_name:i.full_name,role:i.role})}})}catch(s){console.error("Failed to fetch missing teachers via RPC:",s)}return t},async getClassDetails(e){if(!e)return null;const{data:r,error:a}=await n.from("classes").select(`
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
            `).eq("id",e).single();if(a)throw a;return r},async createClass(e,r,a=null,t=null){if(!e||!r)throw new Error("Имя класса и ID учителя обязательны");const{data:c,error:s}=await n.from("classes").insert([{name:e.trim(),teacher_id:r,branch_id:a||null,subject_id:t||null}]).select(`
                *,
                branch:branches (id, name)
            `).single();if(s)throw s;return c},async updateClass(e,r){if(!e||!r)throw new Error("Некорректные параметры для обновления");const a=f(r),{data:t,error:c}=await n.from("classes").update(a).eq("id",e).select(`
                id, name, description, invite_code, branch_id, subject_id, branch:branches(id, name)
            `).single();if(c)throw c;return t},async joinClassByCode(e,r,a="student"){if(!e||!r)throw new Error("Код приглашения обязателен");const{data:t,error:c}=await n.from("classes").select("id, name").eq("invite_code",r.trim()).single();if(c||!t)throw new Error("Класс с таким кодом не найден");return["teacher","admin","super_admin"].includes(a)?await this.addTeacherToClass(t.id,e):await this.addStudentToClass(t.id,e),t},async deleteClass(e){if(!e)return!1;const{error:r}=await n.from("classes").delete().eq("id",e);if(r)throw r;return!0},async getClassMembers(e){if(!e)return[];const{data:r,error:a}=await n.from("class_members").select(`
                joined_at,
                student:profiles!class_members_student_id_fkey (
                    id, 
                    full_name, 
                    grade, 
                    school
                )
            `).eq("class_id",e).order("joined_at",{ascending:!1});if(a)throw a;return r.map(t=>({joinedAt:t.joined_at,...t.student}))},async addStudentToClass(e,r){if(!e||!r)throw new Error("ID класса и ученика обязательны");const{data:a,error:t}=await n.from("class_members").select("class_id").eq("class_id",e).eq("student_id",r).single();if(t&&t.code!=="PGRST116")throw t;if(a)throw new Error("Ученик уже состоит в этом классе");const{error:c}=await n.from("class_members").insert([{class_id:e,student_id:r}]);if(c)throw c;return!0},async removeStudentFromClass(e,r){if(!e||!r)return!1;const{error:a}=await n.from("class_members").delete().eq("class_id",e).eq("student_id",r);if(a)throw a;return!0},async searchAvailableStudents(e,r=""){try{const{data:a,error:t}=await n.from("class_members").select("student_id").eq("class_id",e);if(t)throw t;const c=a.map(i=>i.student_id);let s=n.from("profiles").select("id, full_name, grade, school").eq("role","student");if(c.length>0&&(s=s.not("id","in",`(${c.join(",")})`)),r&&r.trim().length>0){const i=`%${r.trim()}%`;s=s.or(`full_name.ilike.${i},email.ilike.${i}`)}const{data:l,error:o}=await s.limit(50);if(o)throw o;return l}catch(a){throw console.error("Error searching students:",a),a}},async getClassTeachers(e){if(!e)return[];const{data:r,error:a}=await n.from("class_teachers").select(`
                added_at,
                teacher:profiles!class_teachers_teacher_id_fkey (
                    id, 
                    full_name, 
                    avatar_url
                )
            `).eq("class_id",e).order("added_at",{ascending:!0});if(a)throw a;return r.map(t=>({addedAt:t.added_at,...t.teacher}))},async addTeacherToClass(e,r){if(!e||!r)throw new Error("ID класса и учителя обязательны");const{error:a}=await n.from("class_teachers").insert([{class_id:e,teacher_id:r}]);if(a)throw a.code==="23505"?new Error("Учитель уже добавлен в этот класс"):a;return!0},async removeTeacherFromClass(e,r){if(!e||!r)return!1;const{error:a}=await n.from("class_teachers").delete().eq("class_id",e).eq("teacher_id",r);if(a)throw a;return!0},async searchAvailableTeachers(e,r=""){try{const{data:a}=await n.from("classes").select("teacher_id").eq("id",e).single(),t=a==null?void 0:a.teacher_id,{data:c}=await n.from("class_teachers").select("teacher_id").eq("class_id",e),s=(c||[]).map(d=>d.teacher_id);t&&s.push(t);let l=n.from("profiles").select("id, full_name, role").in("role",["teacher","admin","super_admin"]);if(s.length>0&&(l=l.not("id","in",`(${s.join(",")})`)),r&&r.trim().length>0){const d=`%${r.trim()}%`;l=l.ilike("full_name",d)}const{data:o,error:i}=await l.limit(20);if(i)throw i;return o}catch(a){throw console.error("Error searching teachers:",a),a}}},w={async getBranches(){const{data:e,error:r}=await n.from("branches").select("id, name").order("name",{ascending:!0});if(r)throw r;return e||[]},async createBranch(e){if(!(e!=null&&e.trim()))throw new Error("Название филиала обязательно");const{data:r,error:a}=await n.from("branches").insert([{name:e.trim()}]).select().single();if(a)throw a.code==="23505"?new Error("Филиал с таким названием уже существует"):a;return r},async deleteBranch(e){if(!e)return!1;const{error:r}=await n.from("branches").delete().eq("id",e);if(r)throw r;return!0}};export{w as b,u as c};
