(function () {
  const STORAGE_KEY = "arabElramelAttendanceV1";

  const students = [
    {
      id: "s1",
      code: "AR-1001",
      name: "أحمد محمد علي",
      grade: "الصف الأول الإعدادي",
      className: "1 / أ",
      guardian: "ولي أمر أحمد",
      guardianPhone: "01030203442",
      pin: "3442"
    },
    {
      id: "s2",
      code: "AR-1002",
      name: "ملك محمود حسن",
      grade: "الصف الأول الإعدادي",
      className: "1 / ب",
      guardian: "ولي أمر ملك",
      guardianPhone: "01018931429",
      pin: "1429"
    },
    {
      id: "s3",
      code: "AR-2001",
      name: "يوسف خالد إبراهيم",
      grade: "الصف الثاني الإعدادي",
      className: "2 / أ",
      guardian: "ولي أمر يوسف",
      guardianPhone: "01122223333",
      pin: "3333"
    }
  ];

  const seedRecords = [
    { studentId: "s1", date: "2026-05-19", status: "present", note: "حضور منتظم" },
    { studentId: "s1", date: "2026-05-20", status: "late", note: "تأخير 15 دقيقة" },
    { studentId: "s1", date: "2026-05-21", status: "present", note: "" },
    { studentId: "s1", date: "2026-05-22", status: "absent", note: "لم يتم تقديم عذر" },
    { studentId: "s2", date: "2026-05-19", status: "present", note: "" },
    { studentId: "s2", date: "2026-05-20", status: "present", note: "" },
    { studentId: "s2", date: "2026-05-21", status: "excused", note: "عذر مقبول" },
    { studentId: "s3", date: "2026-05-19", status: "late", note: "تأخير 10 دقائق" },
    { studentId: "s3", date: "2026-05-20", status: "absent", note: "تم التواصل مع ولي الأمر" },
    { studentId: "s3", date: "2026-05-21", status: "absent", note: "غياب متكرر" }
  ];

  const statusLabels = {
    present: "حاضر",
    late: "متأخر",
    absent: "غائب",
    excused: "غياب بعذر"
  };

  function readRecords() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
      return [...seedRecords];
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedRecords));
      return [...seedRecords];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function getStudentRecords(studentId) {
    return readRecords()
      .filter(record => record.studentId === studentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function summarize(records) {
    const total = records.length;
    const present = records.filter(record => record.status === "present").length;
    const late = records.filter(record => record.status === "late").length;
    const absent = records.filter(record => record.status === "absent").length;
    const excused = records.filter(record => record.status === "excused").length;
    const attendanceRate = total ? Math.round(((present + late + excused) / total) * 100) : 0;

    return { total, present, late, absent, excused, attendanceRate };
  }

  function renderStat(label, value, tone) {
    return `<div class="attendance-stat ${tone || ""}"><strong>${escapeHTML(value)}</strong><span>${escapeHTML(label)}</span></div>`;
  }

  function renderParentPortal(student) {
    const records = getStudentRecords(student.id);
    const stats = summarize(records);
    const warning = stats.absent >= 2
      ? `<div class="alert alert-warning mt-3">تنبيه: يوجد غياب متكرر. يفضل التواصل مع إدارة المدرسة لمتابعة الحالة.</div>`
      : "";

    const rows = records.map(record => `
      <tr>
        <td>${escapeHTML(record.date)}</td>
        <td><span class="attendance-badge ${record.status}">${escapeHTML(statusLabels[record.status])}</span></td>
        <td>${escapeHTML(record.note || "لا توجد ملاحظات")}</td>
      </tr>
    `).join("");

    const message = encodeURIComponent(`متابعة حضور الطالب ${student.name}\nكود الطالب: ${student.code}\nعدد أيام الغياب: ${stats.absent}\nنسبة الالتزام: ${stats.attendanceRate}%`);

    return `
      <section class="attendance-panel">
        <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
          <div>
            <span class="text-primary fw-bold">${escapeHTML(student.grade)} - ${escapeHTML(student.className)}</span>
            <h2 class="h3 fw-bold mt-1">${escapeHTML(student.name)}</h2>
            <p class="mb-0">ولي الأمر: ${escapeHTML(student.guardian)}</p>
          </div>
          <a class="btn-school btn-primary-school align-self-start" target="_blank" rel="noopener" href="https://wa.me/2${escapeHTML(student.guardianPhone)}?text=${message}">التواصل عبر واتساب</a>
        </div>

        ${warning}

        <div class="attendance-stats mt-4">
          ${renderStat("نسبة الالتزام", `${stats.attendanceRate}%`, "good")}
          ${renderStat("حضور", stats.present, "good")}
          ${renderStat("تأخير", stats.late, "warn")}
          ${renderStat("غياب", stats.absent, "danger")}
        </div>

        <div class="school-table table-responsive mt-4">
          <table class="table table-bordered align-middle">
            <thead><tr><th>التاريخ</th><th>الحالة</th><th>ملاحظات المدرسة</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3">لا توجد سجلات حضور بعد.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function initParentPortal() {
    const form = document.getElementById("parentAttendanceForm");
    if (!form) return;

    form.addEventListener("submit", event => {
      event.preventDefault();
      const code = document.getElementById("studentCode").value.trim().toUpperCase();
      const pin = document.getElementById("guardianPin").value.trim();
      const result = document.getElementById("parentAttendanceResult");
      const student = students.find(item => item.code.toUpperCase() === code && item.pin === pin);

      result.innerHTML = student
        ? renderParentPortal(student)
        : `<div class="alert alert-danger">بيانات الدخول غير صحيحة. تأكد من كود الطالب وآخر 4 أرقام من هاتف ولي الأمر.</div>`;
    });
  }

  function upsertRecord(newRecord) {
    const records = readRecords();
    const existingIndex = records.findIndex(record => record.studentId === newRecord.studentId && record.date === newRecord.date);

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    saveRecords(records);
  }

  function renderAdminDashboard() {
    const target = document.getElementById("adminAttendanceDashboard");
    if (!target) return;

    const rows = students.map(student => {
      const records = getStudentRecords(student.id);
      const stats = summarize(records);
      const alertClass = stats.absent >= 2 ? "table-warning" : "";

      return `
        <tr class="${alertClass}">
          <td>${escapeHTML(student.name)}</td>
          <td>${escapeHTML(student.grade)}</td>
          <td>${stats.attendanceRate}%</td>
          <td>${stats.present}</td>
          <td>${stats.late}</td>
          <td>${stats.absent}</td>
          <td>${stats.absent >= 2 ? "يحتاج متابعة" : "مستقر"}</td>
        </tr>
      `;
    }).join("");

    target.innerHTML = `
      <div class="school-table table-responsive">
        <table class="table table-bordered align-middle">
          <thead><tr><th>الطالب</th><th>الصف</th><th>الالتزام</th><th>حضور</th><th>تأخير</th><th>غياب</th><th>التنبيه</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="attendance-note mt-3">في النسخة المتصلة بقاعدة بيانات، هذه اللوحة تكون محمية بحسابات وصلاحيات للمدير وشؤون الطلاب فقط.</div>
    `;
  }

  function initAdminPortal() {
    const form = document.getElementById("adminAttendanceForm");
    if (!form) return;

    const studentSelect = document.getElementById("adminStudent");
    const dateInput = document.getElementById("attendanceDate");
    const alert = document.getElementById("adminSaveAlert");

    studentSelect.innerHTML = students.map(student => `<option value="${student.id}">${escapeHTML(student.name)} - ${escapeHTML(student.className)}</option>`).join("");
    dateInput.valueAsDate = new Date();
    renderAdminDashboard();

    form.addEventListener("submit", event => {
      event.preventDefault();
      upsertRecord({
        studentId: studentSelect.value,
        date: dateInput.value,
        status: document.getElementById("attendanceStatus").value,
        note: document.getElementById("attendanceNote").value.trim()
      });

      alert.textContent = "تم حفظ حالة الحضور وتحديث ملخص المدرسة.";
      alert.classList.remove("d-none");
      renderAdminDashboard();
    });

    document.getElementById("resetAttendanceDemo").addEventListener("click", () => {
      saveRecords([...seedRecords]);
      alert.textContent = "تمت إعادة بيانات التجربة.";
      alert.classList.remove("d-none");
      renderAdminDashboard();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initParentPortal();
    initAdminPortal();
  });
}());
