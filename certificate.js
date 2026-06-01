const SHEET_BASE_URL = "https://opensheet.elk.sh/1y7NekqhM3tJ8FCQFiBKtJpOwtJrfY13rtiWF6M-Ttcg/";

const CERTIFICATE_TEMPLATES = {
  first: {
    sheetNames: ["أولى", "الصف الأول الإعدادي", "الصف الاول الاعدادي"],
    title: "شهادة الصف الأول الاعدادى",
    gradeLabel: "الصف الأول الإعدادى",
    controller: "علاء الدين محمد المرسى"
  },
  second: {
    sheetNames: ["ثانية", "الصف الثاني الإعدادي", "الصف الثانى الاعدادى"],
    title: "شهادة الصف الثانى الاعدادى",
    gradeLabel: "الصف الثانى الإعدادى",
    controller: "عبدالواحد عبدالمعطى"
  }
};

const CERTIFICATE_SUBJECTS = [
  { label: "اللغة العربية والخط العربي", max: 80, min: 40, aliases: ["اللغة العربية والخط العربي", "اللغة العربية", "عربي", "عربى"] },
  { label: "اللغة الانجليزية", max: 60, min: 30, aliases: ["اللغة الانجليزية", "اللغة الإنجليزية", "انجليزي", "إنجليزي"] },
  { label: "الدراسات الاجتماعية", max: 40, min: 20, aliases: ["الدراسات الاجتماعية", "دراسات"] },
  { label: "رياضيات", max: 60, min: 30, aliases: ["رياضيات", "الرياضيات"] },
  { label: "العلوم", max: 40, min: 20, aliases: ["العلوم", "علوم"] },
  { label: "مجموع", max: 280, min: 140, aliases: ["مجموع", "المجموع", "المجموع الكلى", "المجموع الكلي"] },
  { label: "التربية الفنية", max: 20, min: 10, aliases: ["التربية الفنية", "الفنية", "فنية"] },
  { label: "الكمبيوتر وتكنولوجيا المعلومات", max: 20, min: 10, aliases: ["الكمبيوتر وتكنولوجيا المعلومات", "الكمبيوتر", "حاسب", "الحاسب", "حاسب آلي", "حاسب الى"] },
  { label: "التربية الدينية", max: 40, min: 28, aliases: ["التربية الدينية", "دين", "الدين"] }
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getByAliases(row, aliases) {
  const keys = Object.keys(row || {});
  for (const alias of aliases) {
    const exact = row[alias];
    if (exact !== undefined && exact !== null && exact !== "") return exact;
  }

  const normalizedAliases = aliases.map(normalizeText);
  const foundKey = keys.find(key => {
    const normalizedKey = normalizeText(key);
    if (normalizedKey.startsWith("تقدير ")) return false;
    return normalizedAliases.some(alias =>
      normalizedKey === alias ||
      normalizedKey.startsWith(alias) ||
      alias.startsWith(normalizedKey)
    );
  });
  return foundKey ? row[foundKey] : "";
}

function toNumber(value) {
  const clean = String(value ?? "").replace(/[^\d.]/g, "");
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function getStudentName(row) {
  return getByAliases(row, ["الاسم", "اسم الطالب", "اسم الطالب رباعى", "اسم الطالب رباعي"]);
}

function getSeatNumber(row) {
  return getByAliases(row, ["رقم الجلوس", "رقم الجلوس "]);
}

function findTemplate(sheetName) {
  const normalized = normalizeText(sheetName);
  if (CERTIFICATE_TEMPLATES.first.sheetNames.some(name => normalizeText(name) === normalized)) {
    return CERTIFICATE_TEMPLATES.first;
  }
  if (CERTIFICATE_TEMPLATES.second.sheetNames.some(name => normalizeText(name) === normalized)) {
    return CERTIFICATE_TEMPLATES.second;
  }
  return null;
}

function subjectDegree(row, subject) {
  const value = getByAliases(row, subject.aliases);
  if (value !== "") return value;

  if (subject.label === "مجموع") {
    const total = CERTIFICATE_SUBJECTS.slice(0, 5).reduce((sum, item) => sum + toNumber(getByAliases(row, item.aliases)), 0);
    return total || "";
  }

  return "";
}

function certificateState(row) {
  const explicitState = getByAliases(row, ["الحالة", "حالة الطالب", "النتيجة"]);
  if (explicitState) return explicitState;

  const coreSubjects = CERTIFICATE_SUBJECTS.slice(0, 5);
  const failedCore = coreSubjects.some(subject => toNumber(subjectDegree(row, subject)) < subject.min);
  const total = toNumber(subjectDegree(row, CERTIFICATE_SUBJECTS[5]));
  return !failedCore && total >= 140 ? "ناجح" : "له دور ثان";
}

function renderCertificate(row, template) {
  const degreeCells = CERTIFICATE_SUBJECTS.map(subject => `<td>${escapeHTML(subjectDegree(row, subject))}</td>`).join("");
  const headers = CERTIFICATE_SUBJECTS.map(subject => `<th class="subject-header">${escapeHTML(subject.label)}</th>`).join("");
  const maxCells = CERTIFICATE_SUBJECTS.map(subject => `<td>${subject.max}</td>`).join("");
  const minCells = CERTIFICATE_SUBJECTS.map(subject => `<td>${subject.min}</td>`).join("");

  return `
    <section class="certificate-shell">
      <div class="certificate-paper">
        <img class="certificate-logo" src="images/logo.jpg" alt="شعار المدرسة">

        <h1 class="certificate-title">${escapeHTML(template.title)}</h1>
        <div class="certificate-subtitle">شهادة آخر العام</div>

        <div class="certificate-meta-grid">
          <div>قويسنا التعليمية</div>
          <div>${escapeHTML(template.gradeLabel)}</div>
          <div>عرب الرمل الاعدادية</div>
        </div>

        <div class="certificate-year">امتحان الدور الأول الفصل الدراسى الثانى لعام</div>

        <div class="student-line">
          <div>اسم الطالب : <span class="student-value">${escapeHTML(getStudentName(row))}</span></div>
          <div>رقم الجلوس : <span class="student-value">${escapeHTML(getSeatNumber(row))}</span></div>
        </div>

        <table class="certificate-table" aria-label="جدول شهادة النجاح">
          <thead>
            <tr>
              <th class="row-label">المادة</th>
              ${headers}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="row-label">النهاية العظمى</td>
              ${maxCells}
            </tr>
            <tr>
              <td class="row-label">النهاية الصغرى</td>
              ${minCells}
            </tr>
            <tr>
              <td class="row-label">درجة الطالب</td>
              ${degreeCells}
            </tr>
          </tbody>
        </table>

        <div class="state-row">
          <div>الحالة</div>
          <div>${escapeHTML(certificateState(row))}</div>
        </div>

        <div class="second-round">موعد امتحان الدور الثانى فى  2026/07/25</div>

        <div class="signatures">
          <div class="signature-box">
            <div>مسئول الصف</div>
            <div class="signature-name">د/ بسمة محفوظ</div>
            <div class="signature-name">توقيع وكيلة المدرسة</div>
            <div class="stamp-box">الختم الرسمي</div>
          </div>
          <div class="signature-box">
            <div>رئيس الكنترول</div>
            <div class="signature-name">${escapeHTML(template.controller)}</div>
          </div>
          <div class="signature-box">
            <div>مدير المدرسة</div>
            <div class="signature-name">ا/عزب عبد المنعم</div>
            <div class="signature-name">توقيع مدير المدرسة</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function showError(message) {
  document.getElementById("certificateRoot").innerHTML = `<div class="certificate-alert">${escapeHTML(message)}</div>`;
}

async function loadCertificate() {
  const params = new URLSearchParams(window.location.search);
  const sheetName = params.get("sheet") || "";
  const seatNumber = params.get("seat") || "";
  const template = findTemplate(sheetName);

  if (!template) {
    showError("نموذج الشهادة متاح حاليًا للصف الأول الإعدادي والصف الثاني الإعدادي فقط.");
    return;
  }

  if (!seatNumber) {
    showError("لم يتم إرسال رقم الجلوس. ارجع إلى صفحة النتائج ثم اضغط استخراج شهادة النجاح بعد عرض النتيجة.");
    return;
  }

  try {
    const response = await fetch(SHEET_BASE_URL + encodeURIComponent(sheetName));
    const rows = await response.json();
    const student = rows.find(row => String(getSeatNumber(row)).trim() === seatNumber);

    if (!student) {
      showError("لم يتم العثور على بيانات الطالب في الشيت المحدد.");
      return;
    }

    document.title = `شهادة نجاح - ${getStudentName(student) || seatNumber}`;
    document.getElementById("certificateRoot").innerHTML = renderCertificate(student, template);
  } catch (error) {
    showError("تعذر تحميل بيانات الشهادة الآن. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.");
  }
}

document.getElementById("printCertificateBtn").addEventListener("click", () => window.print());
document.getElementById("downloadPdfBtn").addEventListener("click", () => window.print());

loadCertificate();
