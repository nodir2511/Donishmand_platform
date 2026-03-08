
const teacher = [];
if (!teacher) {
    console.log("!teacher is true for []");
} else {
    console.log("!teacher is false for [] (EMPTY ARRAY IS TRUTHY!)");
}

if (!teacher || (Array.isArray(teacher) && teacher.length === 0)) {
    console.log("Proper check correctly identifies empty array");
}
