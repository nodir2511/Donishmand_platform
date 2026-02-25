import{s}from"./index-CZ7BpQlM.js";const _={async getTeacherClasses(e){if(!e)return[];const{data:r,error:a}=await s.from("classes").select(`
                id, 
                name, 
                created_at,
                branch_id,
                subject_id,
                branch:branches (id, name),
                class_members (count)
            `).eq("teacher_id",e).order("created_at",{ascending:!1});if(a)throw a;const{data:t,error:c}=await s.from("class_teachers").select(`
                classes (
                    id, 
                    name, 
                    created_at,
                    branch_id,
                    subject_id,
                    branch:branches (id, name),
                    class_members (count)
                )
            `).eq("teacher_id",e);if(c)throw c;const n=t.map(i=>i.classes).filter(i=>i),o=[...r,...n],d=Array.from(new Map(o.map(i=>[i.id,i])).values());return d.sort((i,l)=>new Date(l.created_at)-new Date(i.created_at)),d.map(i=>{var l,h;return{...i,studentsCount:((h=(l=i.class_members)==null?void 0:l[0])==null?void 0:h.count)||0}})},async getStudentClasses(e){if(!e)return[];const{data:r,error:a}=await s.from("class_members").select(`
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
            `).eq("student_id",e);if(a)throw a;return r.map(t=>({...t.classes,teacher:t.classes.teacher,joinedAt:t.joined_at}))},async getClassDetails(e){if(!e)return null;const{data:r,error:a}=await s.from("classes").select(`
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
            `).eq("id",e).single();if(a)throw a;return r},async createClass(e,r,a=null,t=null){if(!e||!r)throw new Error("Имя класса и ID учителя обязательны");const{data:c,error:n}=await s.from("classes").insert([{name:e.trim(),teacher_id:r,branch_id:a||null,subject_id:t||null}]).select(`
                *,
                branch:branches (id, name)
            `).single();if(n)throw n;return c},async updateClass(e,r){if(!e||!r)throw new Error("Некорректные параметры для обновления");const a=Object.entries(r).reduce((n,[o,d])=>(d!==void 0&&(n[o]=d),n),{}),{data:t,error:c}=await s.from("classes").update(a).eq("id",e).select(`
                id, name, description, invite_code, branch_id, subject_id, branch:branches(id, name)
            `).single();if(c)throw c;return t},async joinClassByCode(e,r,a="student"){if(!e||!r)throw new Error("Код приглашения обязателен");const{data:t,error:c}=await s.from("classes").select("id, name").eq("invite_code",r.trim()).single();if(c||!t)throw new Error("Класс с таким кодом не найден");return["teacher","admin","super_admin"].includes(a)?await this.addTeacherToClass(t.id,e):await this.addStudentToClass(t.id,e),t},async deleteClass(e){if(!e)return!1;const{error:r}=await s.from("classes").delete().eq("id",e);if(r)throw r;return!0},async getClassMembers(e){if(!e)return[];const{data:r,error:a}=await s.from("class_members").select(`
                joined_at,
                student:profiles!class_members_student_id_fkey (
                    id, 
                    full_name, 
                    grade, 
                    school
                )
            `).eq("class_id",e).order("joined_at",{ascending:!1});if(a)throw a;return r.map(t=>({joinedAt:t.joined_at,...t.student}))},async addStudentToClass(e,r){if(!e||!r)throw new Error("ID класса и ученика обязательны");const{data:a,error:t}=await s.from("class_members").select("class_id").eq("class_id",e).eq("student_id",r).single();if(t&&t.code!=="PGRST116")throw t;if(a)throw new Error("Ученик уже состоит в этом классе");const{error:c}=await s.from("class_members").insert([{class_id:e,student_id:r}]);if(c)throw c;return!0},async removeStudentFromClass(e,r){if(!e||!r)return!1;const{error:a}=await s.from("class_members").delete().eq("class_id",e).eq("student_id",r);if(a)throw a;return!0},async searchAvailableStudents(e,r=""){try{const{data:a,error:t}=await s.from("class_members").select("student_id").eq("class_id",e);if(t)throw t;const c=a.map(i=>i.student_id);let n=s.from("profiles").select("id, full_name, grade, school").eq("role","student");if(c.length>0&&(n=n.not("id","in",`(${c.join(",")})`)),r&&r.trim().length>0){const i=`%${r.trim()}%`;n=n.or(`full_name.ilike.${i},email.ilike.${i}`)}const{data:o,error:d}=await n.limit(50);if(d)throw d;return o}catch(a){throw console.error("Error searching students:",a),a}},async getClassTeachers(e){if(!e)return[];const{data:r,error:a}=await s.from("class_teachers").select(`
                added_at,
                teacher:profiles!class_teachers_teacher_id_fkey (
                    id, 
                    full_name, 
                    avatar_url
                )
            `).eq("class_id",e).order("added_at",{ascending:!0});if(a)throw a;return r.map(t=>({addedAt:t.added_at,...t.teacher}))},async addTeacherToClass(e,r){if(!e||!r)throw new Error("ID класса и учителя обязательны");const{error:a}=await s.from("class_teachers").insert([{class_id:e,teacher_id:r}]);if(a)throw a.code==="23505"?new Error("Учитель уже добавлен в этот класс"):a;return!0},async removeTeacherFromClass(e,r){if(!e||!r)return!1;const{error:a}=await s.from("class_teachers").delete().eq("class_id",e).eq("teacher_id",r);if(a)throw a;return!0},async searchAvailableTeachers(e,r=""){try{const{data:a}=await s.from("classes").select("teacher_id").eq("id",e).single(),t=a==null?void 0:a.teacher_id,{data:c}=await s.from("class_teachers").select("teacher_id").eq("class_id",e),n=(c||[]).map(l=>l.teacher_id);t&&n.push(t);let o=s.from("profiles").select("id, full_name, role").in("role",["teacher","admin","super_admin"]);if(n.length>0&&(o=o.not("id","in",`(${n.join(",")})`)),r&&r.trim().length>0){const l=`%${r.trim()}%`;o=o.ilike("full_name",l)}const{data:d,error:i}=await o.limit(20);if(i)throw i;return d}catch(a){throw console.error("Error searching teachers:",a),a}}},m={async getBranches(){const{data:e,error:r}=await s.from("branches").select("id, name").order("name",{ascending:!0});if(r)throw r;return e||[]},async createBranch(e){if(!(e!=null&&e.trim()))throw new Error("Название филиала обязательно");const{data:r,error:a}=await s.from("branches").insert([{name:e.trim()}]).select().single();if(a)throw a.code==="23505"?new Error("Филиал с таким названием уже существует"):a;return r},async deleteBranch(e){if(!e)return!1;const{error:r}=await s.from("branches").delete().eq("id",e);if(r)throw r;return!0}};export{m as b,_ as c};
