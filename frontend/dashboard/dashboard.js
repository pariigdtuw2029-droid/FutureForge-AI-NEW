// ===============================
// AI HELPDESK DASHBOARD
// dashboard.js
// ===============================
const API_BASE = "http://127.0.0.1:8000";

/**
 * Shared fetch wrapper for calls to the FutureForge API.
 *
 * Centralizes what used to be repeated inline in every agent call
 * (JSON headers, optional Bearer auth, parsing the {success, data,
 * message} / {detail} envelope, and turning a non-2xx response into a
 * thrown Error) so each call site is just the request-specific bits.
 *
 * @param {string} path - e.g. "/agents/skill-gap"
 * @param {object} [options]
 * @param {"GET"|"POST"} [options.method="GET"]
 * @param {object|null} [options.body=null] - JSON body (ignored for isForm)
 * @param {boolean} [options.auth=false] - attach the saved Bearer token
 * @param {FormData|null} [options.formData=null] - send as multipart instead of JSON
 * @returns {Promise<any>} the parsed response body
 */
async function apiFetch(path, { method = "GET", body = null, auth = false, formData = null } = {}) {

    const headers = {};

    if (!formData && body !== null) headers["Content-Type"] = "application/json";

    if (auth) {
        const token = localStorage.getItem("access_token");
        if (!token) {
            throw new Error("Please log in first.");
        }
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE + path, {
        method,
        headers,
        body: formData ? formData : (body !== null ? JSON.stringify(body) : undefined)
    });

    let data = null;
    try { data = await response.json(); } catch (_) { /* empty/non-JSON body */ }

    if (!response.ok) {
        const message = (data && (data.message || data.detail)) || `Request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
    }

    return data;

}

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "../auth/login.html";
        return;
    }

    try {

        const response = await fetch(API_BASE + "/auth/profile", {

            method: "GET",

            headers: {
                "Authorization": `Bearer ${token}`
            }

        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const user = await response.json();

        // Save latest user info
        localStorage.setItem(
            "ai_helpdesk_user",
            JSON.stringify(user)
        );

        // NOTE (fixed bug found in Phase 6 integration testing): this looked
        // up "welcomeName", an ID that doesn't exist anywhere in
        // dashboard.html — the actual element is <span id="user-name"> in
        // the welcome header. Because the lookup was null-guarded below,
        // this didn't crash, it just silently never fired: the header
        // was stuck on its static placeholder text ("Loading...") forever.
        const welcomeName = document.getElementById("user-name");
        const userName = document.getElementById("userName");
        const userAvatar = document.getElementById("userAvatar");

        const firstName = user.name.split(" ")[0];

        const initials = user.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        if (welcomeName) {
            welcomeName.textContent = firstName;
        }

        if (userName) {
            userName.textContent = user.name;
        }

        if (userAvatar) {
            userAvatar.textContent = initials;
        }

    } catch (err) {

        console.error(err);

        localStorage.removeItem("access_token");
        localStorage.removeItem("ai_helpdesk_user");

        window.location.href = "../auth/login.html";

    }

});
    // ===============================
    // View All (Technical Skills -> Skill Gap section)
    // ===============================

    const viewAllSkillsLink=document.getElementById("viewAllSkillsLink");

    if(viewAllSkillsLink){

        viewAllSkillsLink.addEventListener("click",(e)=>{

            e.preventDefault();

            const skillTab=document.querySelector('.menu li[data-section="skill"]');

            if(skillTab) activateSection(skillTab);

        });

    }


    // ===============================
    // Quick Actions (Home)
    // ===============================

    document.querySelectorAll(".quick-action-btn").forEach(btn => {

        btn.addEventListener("click", () => {

            const target = document.querySelector(
                `.menu li[data-section="${btn.dataset.gotoSection}"]`
            );

            if (target) activateSection(target);

        });

    });

    // ===============================
    // Recent Activity Log (shared, localStorage-backed)
    // ===============================

    const ACTIVITY_LOG_KEY = "ai_helpdesk_activity_log";

    function getActivityLog() {

        try {

            return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || "[]");

        } catch (err) {

            return [];

        }

    }

    function renderActivityLog() {

        const listEl = document.getElementById("recentActivityList");
        if (!listEl) return;

        const log = getActivityLog();

        if (log.length === 0) {

            listEl.innerHTML =
                `<div class="activity-item">
                    <div class="activity-icon"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></div>
                    <div>
                        <p>No activity yet — actions across the dashboard will show up here.</p>
                        <span class="activity-time">Just now</span>
                    </div>
                </div>`;
            return;

        }

        listEl.innerHTML = log.slice(0, 8).map(entry =>
            `<div class="activity-item">
                <div class="activity-icon"><i class="fa-solid ${entry.icon}" aria-hidden="true"></i></div>
                <div>
                    <p>${entry.message}</p>
                    <span class="activity-time">${new Date(entry.time).toLocaleString()}</span>
                </div>
            </div>`
        ).join("");

    }

    // Exposed globally so agent sections (Resume Analyzer, Skill Gap,
    // Learning Planner, Project Architect, etc.) can log real actions.
    window.logActivity = function (message, icon = "fa-circle-check") {

        const log = getActivityLog();

        log.unshift({ message, icon, time: new Date().toISOString() });

        localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log.slice(0, 30)));

        renderActivityLog();

    };

    renderActivityLog();

    // ===============================
    // Dashboard charts (Chart.js)
    // ===============================

    const prefersReducedMotion=window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if(typeof Chart !== "undefined"){

        Chart.defaults.color="#d8d8d8";
        Chart.defaults.font.family="'Poppins', sans-serif";

        // --- Career Progress Trend (line chart) ---

        const trendCanvas=document.getElementById("progressTrendChart");

        if(trendCanvas){

            const ctx=trendCanvas.getContext("2d");

            const gradient=ctx.createLinearGradient(0,0,0,220);
            gradient.addColorStop(0,"rgba(255,79,216,.35)");
            gradient.addColorStop(1,"rgba(255,79,216,0)");

            new Chart(trendCanvas,{

                type:"line",

                data:{

                    labels:["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6"],

                    datasets:[{

                        label:"Career Readiness",
                        data:[58,62,65,71,76,81],
                        borderColor:"#ff4fd8",
                        backgroundColor:gradient,
                        borderWidth:3,
                        pointBackgroundColor:"#ffffff",
                        pointBorderColor:"#8A2BE2",
                        pointRadius:4,
                        pointHoverRadius:6,
                        tension:.4,
                        fill:true

                    }]

                },

                options:{

                    responsive:true,
                    maintainAspectRatio:false,
                    animation:prefersReducedMotion ? false : { duration:1000 },

                    plugins:{

                        legend:{ display:false },

                        tooltip:{

                            backgroundColor:"rgba(10,20,45,.95)",
                            borderColor:"rgba(255,255,255,.15)",
                            borderWidth:1,
                            padding:12,
                            callbacks:{

                                label:(item)=>` ${item.parsed.y}% ready`

                            }

                        }

                    },

                    scales:{

                        y:{

                            min:0,
                            max:100,
                            grid:{ color:"rgba(255,255,255,.08)" },
                            ticks:{ callback:(v)=>v+"%" }

                        },

                        x:{

                            grid:{ display:false }

                        }

                    }

                }

            });

        }


        // --- Skill Readiness (doughnut) ---

        const readinessCanvas=document.getElementById("skillReadinessChart");

        if(readinessCanvas){

            const readinessValueEl=document.getElementById("skillReadinessValue");
            const readinessValue=readinessValueEl
                ? parseInt(readinessValueEl.textContent,10) || 63
                : 63;

            new Chart(readinessCanvas,{

                type:"doughnut",

                data:{

                    labels:["Ready","Remaining"],

                    datasets:[{

                        data:[readinessValue,100-readinessValue],
                        backgroundColor:["#ff4fd8","rgba(255,255,255,.08)"],
                        borderWidth:0,
                        cutout:"78%"

                    }]

                },

                options:{

                    responsive:true,
                    maintainAspectRatio:false,
                    animation:prefersReducedMotion ? false : { duration:1000 },

                    plugins:{

                        legend:{ display:false },

                        tooltip:{

                            backgroundColor:"rgba(10,20,45,.95)",
                            borderColor:"rgba(255,255,255,.15)",
                            borderWidth:1,
                            padding:12

                        }

                    }

                }

            });

        }


        // --- Skill Distribution (radar) ---

        const radarCanvas=document.getElementById("skillDistributionChart");

        if(radarCanvas){

            new Chart(radarCanvas,{

                type:"radar",

                data:{

                    labels:["Python","React","SQL","System Design","Communication","Git"],

                    datasets:[{

                        label:"Proficiency",
                        data:[85,70,60,45,75,80],
                        backgroundColor:"rgba(255,79,216,.15)",
                        borderColor:"#ff4fd8",
                        pointBackgroundColor:"#ffffff",
                        pointBorderColor:"#8A2BE2",
                        borderWidth:2

                    }]

                },

                options:{

                    responsive:true,
                    maintainAspectRatio:false,
                    animation:prefersReducedMotion ? false : { duration:1000 },

                    plugins:{

                        legend:{ display:false },

                        tooltip:{

                            backgroundColor:"rgba(10,20,45,.95)",
                            borderColor:"rgba(255,255,255,.15)",
                            borderWidth:1,
                            padding:12

                        }

                    },

                    scales:{

                        r:{

                            min:0,
                            max:100,
                            grid:{ color:"rgba(255,255,255,.1)" },
                            angleLines:{ color:"rgba(255,255,255,.1)" },
                            pointLabels:{ color:"#d8d8d8", font:{ size:11 } },
                            ticks:{ display:false, backdropColor:"transparent" }

                        }

                    }

                }

            });

        }


        // --- Weekly Activity (bar) ---

        const weeklyBarCanvas=document.getElementById("weeklyActivityChart");

        if(weeklyBarCanvas){

            new Chart(weeklyBarCanvas,{

                type:"bar",

                data:{

                    labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],

                    datasets:[{

                        label:"AI Agent Sessions",
                        data:[3,5,2,6,4,1,2],
                        backgroundColor:"#8A2BE2",
                        borderRadius:8,
                        maxBarThickness:34

                    }]

                },

                options:{

                    responsive:true,
                    maintainAspectRatio:false,
                    animation:prefersReducedMotion ? false : { duration:900 },

                    plugins:{

                        legend:{ display:false },

                        tooltip:{

                            backgroundColor:"rgba(10,20,45,.95)",
                            borderColor:"rgba(255,255,255,.15)",
                            borderWidth:1,
                            padding:12

                        }

                    },

                    scales:{

                        y:{

                            beginAtZero:true,
                            grid:{ color:"rgba(255,255,255,.08)" },
                            ticks:{ stepSize:1 }

                        },

                        x:{

                            grid:{ display:false }

                        }

                    }

                }

            });

        }

    }



    // ===============================
    // View Report button
    // ===============================

    const viewReportBtn=document.getElementById("viewReportBtn");
    const mentorReportCard=document.getElementById("mentorReportCard");

    if(viewReportBtn && mentorReportCard){

        viewReportBtn.addEventListener("click",()=>{

            mentorReportCard.scrollIntoView({

                behavior:"smooth",
                block:"center"

            });

            mentorReportCard.classList.add("highlight-pulse");

            setTimeout(()=>{

                mentorReportCard.classList.remove("highlight-pulse");

            },1600);

        });

    }


    // ===============================
    // Sidebar Navigation
    // ===============================

    const menuItems = document.querySelectorAll(".menu li");
    const pages = document.querySelectorAll(".content-page");

    function activateSection(item){

        // Remove active menu
        menuItems.forEach(menu => {

            menu.classList.remove("active");
            menu.removeAttribute("aria-current");

        });

        item.classList.add("active");
        item.setAttribute("aria-current", "page");

        const target = item.getAttribute("data-section");

        // Hide all pages
        pages.forEach(page => {

            page.classList.remove("active");

        });

        // Show selected page
        const activePage = document.getElementById(target);

        if(activePage){

            activePage.classList.add("active");

        }

        // Refresh live, cross-agent data on relevant tabs
        if(target === "mentor" && typeof window.refreshMentorSnapshot === "function"){

            window.refreshMentorSnapshot();

        }

        if(target === "workflow" && typeof window.refreshWorkflowStatus === "function"){

            window.refreshWorkflowStatus();

        }

        // Scroll to top
        window.scrollTo({
            top:0,
            behavior:"smooth"
        });

    }

    // Exposed globally: several agent sections further down this file
    // (outside this DOMContentLoaded closure) need to programmatically
    // switch tabs — e.g. "View All" on Home, or "Generate Learning
    // Roadmap" handing off from Skill Gap to the Learning Planner.
    // ===============================
    // Mobile Sidebar Toggle (off-canvas, <600px)
    // ===============================

    const sidebar = document.getElementById("sidebar");
    const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    function closeMobileSidebar(){

        if (!sidebar) return;

        sidebar.classList.remove("mobile-open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
        if (mobileSidebarToggle) mobileSidebarToggle.setAttribute("aria-expanded", "false");

    }

    function openMobileSidebar(){

        if (!sidebar) return;

        sidebar.classList.add("mobile-open");
        if (sidebarOverlay) sidebarOverlay.classList.add("active");
        if (mobileSidebarToggle) mobileSidebarToggle.setAttribute("aria-expanded", "true");

    }

    if (mobileSidebarToggle && sidebar) {

        mobileSidebarToggle.addEventListener("click", () => {

            if (sidebar.classList.contains("mobile-open")) {

                closeMobileSidebar();

            } else {

                openMobileSidebar();

            }

        });

    }

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener("click", closeMobileSidebar);

    }

    // Close the mobile sidebar whenever a section is chosen
    menuItems.forEach(item => {

        item.addEventListener("click", closeMobileSidebar);

    });

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") closeMobileSidebar();

    });

    window.activateSection = activateSection;

    // ===============================
    // Sidebar Collapse Toggle
    // ===============================

    const sidebarCollapseBtn = document.getElementById("sidebarCollapseBtn");
    const SIDEBAR_COLLAPSE_KEY = "ai_helpdesk_sidebar_collapsed";

    if (sidebar && sidebarCollapseBtn) {

        if (localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true") {

            sidebar.classList.add("collapsed");
            sidebarCollapseBtn.setAttribute("aria-expanded", "false");
            sidebarCollapseBtn.setAttribute("aria-label", "Expand sidebar");

        }

        sidebarCollapseBtn.addEventListener("click", () => {

            const isCollapsed = sidebar.classList.toggle("collapsed");

            sidebarCollapseBtn.setAttribute("aria-expanded", String(!isCollapsed));
            sidebarCollapseBtn.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");

            localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(isCollapsed));

        });

    }

    menuItems.forEach(item => {

        item.addEventListener("click", () => {

            activateSection(item);

        });

        // role="button" items are clickable but not natively
        // keyboard-operable — wire up Enter / Space explicitly.
        item.addEventListener("keydown", (e) => {

            if(e.key === "Enter" || e.key === " "){

                e.preventDefault();
                activateSection(item);

            }

        });

    });


    // ===============================
    // Resume Upload Button
    // ===============================

    const uploadButton = document.getElementById("uploadResume");
    const resumeInput = document.getElementById("resumeFile");

    if(uploadButton && resumeInput){

        uploadButton.addEventListener("click",()=>{

            resumeInput.click();

        });

        resumeInput.addEventListener("change",(e)=>{

            if(e.target.files.length>0){

                uploadButton.innerHTML =
                `<i class="fa-solid fa-circle-check"></i> ${e.target.files[0].name}`;

            }

        });

    }


    // Card hover lift is now handled entirely by CSS (see
    // .glass-card:hover / .stat-card:hover / etc. in dashboard.css).
    // The previous version duplicated this with inline transform.style
    // writes on mouseenter/mouseleave, which fought with each page's
    // own hover rules — removed in favor of one consistent mechanism.


    // ===============================
    // Progress Bar Animation
    // ===============================

    const progressBars=document.querySelectorAll(".progress-fill");

    progressBars.forEach(bar=>{

        const width=bar.style.width;

        bar.style.width="0%";

        setTimeout(()=>{

            bar.style.transition="1.2s ease";

            bar.style.width=width;

        },300);

    });


    // ===============================
    // Search Box
    // ===============================

    const search=document.querySelector(".search-box input");
    const menuEmptyState=document.getElementById("menuEmptyState");

    if(search){

        search.addEventListener("keyup",()=>{

            const value=search.value.toLowerCase();
            let visibleCount=0;

            menuItems.forEach(item=>{

                const matches=item.textContent.toLowerCase().includes(value);

                item.style.display=matches ? "flex" : "none";

                if(matches) visibleCount++;

            });

            if(menuEmptyState){

                menuEmptyState.hidden=visibleCount>0;

            }

        });

    }


    // ===============================
    // Notification Button
    // ===============================

    const bell=document.getElementById("notifBell");
    const notifPanel=document.getElementById("notifPanel");

    function closeNotifPanel(){

        if(!notifPanel) return;

        notifPanel.hidden=true;
        bell.setAttribute("aria-expanded","false");

    }

    function openNotifPanel(){

        if(!notifPanel) return;

        notifPanel.hidden=false;
        bell.setAttribute("aria-expanded","true");

    }

    if(bell && notifPanel){

        bell.addEventListener("click",(e)=>{

            e.stopPropagation();

            if(notifPanel.hidden){

                openNotifPanel();

            }else{

                closeNotifPanel();

            }

        });

        document.addEventListener("click",(e)=>{

            if(!notifPanel.hidden && !notifPanel.contains(e.target) && e.target!==bell){

                closeNotifPanel();

            }

        });

        document.addEventListener("keydown",(e)=>{

            if(e.key==="Escape"){

                closeNotifPanel();

            }

        });

    }


    // ===============================
    // Logout Button
    // ===============================

    const logout=document.querySelector(".logout-btn");

    if(logout){

        logout.addEventListener("click",()=>{

            const confirmLogout=confirm("Do you want to logout?");

            if(confirmLogout){

                localStorage.removeItem("ai_helpdesk_user");

                window.location.href="../index.html";

            }

        });

    }


    // ===============================
    // Start Interview
    // ===============================
    // (Handled by the real Mock Interview flow further down this file —
    //  a legacy placeholder handler that duplicated this click and showed
    //  an extra alert() was removed here.)


/* ===========================
   SKILL GAP AGENT
=========================== */

// ---------- Editable "Current Skills" chip list ----------

let currentSkillsArr = ["Python", "FastAPI", "HTML", "CSS", "JavaScript", "Git"];

const currentSkillsList = document.getElementById("currentSkillsList");
const newSkillInput = document.getElementById("newSkillInput");
const addSkillBtn = document.getElementById("addSkillBtn");

function renderCurrentSkills() {

    if (!currentSkillsList) return;

    currentSkillsList.innerHTML = currentSkillsArr.map(skill =>
        `<span>${skill}<button type="button" class="chip-remove" data-skill="${skill}" aria-label="Remove ${skill}">&times;</button></span>`
    ).join("");

}

function addCurrentSkill() {

    if (!newSkillInput) return;

    const value = newSkillInput.value.trim();

    if (!value) return;

    const alreadyExists = currentSkillsArr.some(
        s => s.toLowerCase() === value.toLowerCase()
    );

    if (alreadyExists) {

        showDashboardToast(`${value} is already in your skills.`, "error");
        newSkillInput.value = "";
        return;

    }

    currentSkillsArr.push(value);
    renderCurrentSkills();
    newSkillInput.value = "";
    newSkillInput.focus();

}

if (addSkillBtn) {

    addSkillBtn.addEventListener("click", addCurrentSkill);

}

if (newSkillInput) {

    newSkillInput.addEventListener("keydown", (e) => {

        if (e.key === "Enter") {

            e.preventDefault();
            addCurrentSkill();

        }

    });

}

if (currentSkillsList) {

    currentSkillsList.addEventListener("click", (e) => {

        const btn = e.target.closest(".chip-remove");

        if (!btn) return;

        currentSkillsArr = currentSkillsArr.filter(s => s !== btn.dataset.skill);
        renderCurrentSkills();

    });

}

renderCurrentSkills();


// ---------- Role-based skill gap profiles ----------
// Stands in for a real backend response — swap for the fetch()
// integration below once the Skill Gap API is available.

const skillRoleProfiles = {

    "AI Engineer": {
        required: ["Python", "TensorFlow", "PyTorch", "FastAPI", "Docker", "AWS", "System Design", "SQL", "Git", "Kubernetes"],
        partial: ["TensorFlow", "FastAPI", "SQL"]
    },

    "Machine Learning Engineer": {
        required: ["Python", "PyTorch", "Scikit-learn", "SQL", "Pandas", "Docker", "MLOps", "Git", "AWS"],
        partial: ["Pandas", "SQL"]
    },

    "Software Engineer": {
        required: ["Java", "Data Structures", "REST APIs", "Git", "SQL", "System Design", "Testing", "Cloud Deployment"],
        partial: ["SQL", "REST APIs"]
    },

    "Data Scientist": {
        required: ["Python", "Pandas", "SQL", "Statistics", "Visualization", "A/B Testing", "Spark", "Git"],
        partial: ["Pandas", "Visualization"]
    },

    "Backend Developer": {
        required: ["Node.js", "Express", "PostgreSQL", "REST APIs", "Git", "System Design", "Docker", "Redis"],
        partial: ["REST APIs", "PostgreSQL"]
    },

    "Full Stack Developer": {
        required: ["JavaScript", "React", "Node.js", "MongoDB", "Git", "HTML", "CSS", "Testing", "Docker"],
        partial: ["HTML", "CSS"]
    }

};

let lastSkillGapAnalysis = null; // read by the Learning Planner once it's wired up
let lastSkillGapRaw = null;      // raw API response, needed by the Learning Planner call
let lastResumeInfoForAgents = null; // structured resume_info shared with skill-gap / learning-plan calls

function computeSkillGap(role) {

    const profile = skillRoleProfiles[role] || skillRoleProfiles["AI Engineer"];
    const currentLower = currentSkillsArr.map(s => s.toLowerCase());
    const partialLower = profile.partial.map(s => s.toLowerCase());

    const matched = [];
    const partial = [];
    const missing = [];

    profile.required.forEach(reqSkill => {

        const has = currentLower.includes(reqSkill.toLowerCase());

        if (!has) {

            missing.push(reqSkill);
            return;

        }

        if (partialLower.includes(reqSkill.toLowerCase())) {

            partial.push(reqSkill);

        } else {

            matched.push(reqSkill);

        }

    });

    const score = Math.round(
        ((matched.length + partial.length * 0.5) / profile.required.length) * 100
    );

    const summary = `You have a strong foundation in ${matched.slice(0, 3).join(", ") || "your existing skills"}. ` +
        `To become industry-ready for ${role}, focus on ${missing.slice(0, 4).join(", ") || "deepening what you already know"}.`;

    return { role, matched, partial, missing, score, summary };

}

const analyzeSkillBtn = document.getElementById("analyzeSkill");

if (analyzeSkillBtn) {

    const analyzeSkillDefaultLabel = analyzeSkillBtn.textContent;

    analyzeSkillBtn.addEventListener("click", () => {

        if (currentSkillsArr.length === 0) {

            showDashboardToast("Add at least one current skill first.", "error");
            return;

        }

        const role = document.getElementById("jobRole").value;

        analyzeSkillBtn.disabled = true;
        analyzeSkillBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Analyzing...';

        // ===============================
        // BACKEND INTEGRATION
        // ===============================
        // Real endpoint: POST /agents/skill-gap (RAG-backed, no auth required).
        // Takes { resume_info, target_role } and returns a SkillGapResult.
        // We build resume_info from whatever the user has entered so far
        // (a real resume upload/extract flow can replace this later — see
        // /agents/resume/extract for structured extraction from raw text).

        const resumeInfo = lastResumeInfoForAgents || {
            candidate_name: null,
            cgpa: null,
            github: null,
            skills: currentSkillsArr,
            projects: [],
            education: null,
            experience: [],
            college_year: null,
            no_of_internships: null
        };

        function finishSkillGap(result) {

            lastSkillGapAnalysis = result;

            renderSkillChips("matchedSkillsList", result.matched);
            renderSkillChips("missingSkillsList", result.missing);
            renderSkillChips("partialSkillsList", result.partial);

            const skillScoreCircle = document.getElementById("skillScoreCircle");
            const skillScoreValue = document.getElementById("skillScoreValue");

            if (skillScoreCircle) {

                skillScoreCircle.style.setProperty("--score", result.score);
                skillScoreCircle.setAttribute("aria-label", `Skill gap readiness score: ${result.score} percent`);

            }

            if (skillScoreValue) skillScoreValue.textContent = `${result.score}%`;

            const summaryEl = document.getElementById("skillFitSummary");
            if (summaryEl) summaryEl.textContent = result.summary;

            analyzeSkillBtn.disabled = false;
            analyzeSkillBtn.textContent = analyzeSkillDefaultLabel;

        }

        apiFetch("/agents/skill-gap", {
            method: "POST",
            body: { resume_info: resumeInfo, target_role: role }
        })
            .then((json) => {

                const data = json.data;
                lastSkillGapRaw = data;
                lastResumeInfoForAgents = resumeInfo;

                finishSkillGap({
                    role,
                    matched: data.matched_skills || [],
                    partial: data.missing_preferred_skills || [],
                    missing: data.missing_required_skills || [],
                    score: data.skill_match_score,
                    summary: data.summary
                });

                showDashboardToast(`Skill gap analyzed for ${role}.`, "success");
                window.logActivity?.(`Skill gap analyzed for ${role} — ${data.skill_match_score}% ready.`, "fa-chart-line");

            })
            .catch((err) => {

                console.error(err);

                // Offline / API-unavailable fallback so the demo still works.
                const result = computeSkillGap(role);
                finishSkillGap(result);

                showDashboardToast(`Live skill-gap API unavailable, showing local estimate for ${role}.`, "error");
                window.logActivity?.(`Skill gap analyzed for ${role} — ${result.score}% ready (offline estimate).`, "fa-chart-line");

            });

    });

}

// Generate Learning Roadmap — hands off to the Learning Planner tab

const goToLearningPlannerBtn = document.getElementById("goToLearningPlanner");

if (goToLearningPlannerBtn) {

    goToLearningPlannerBtn.addEventListener("click", () => {

        const learningTab = document.querySelector('.menu li[data-section="learning"]');

        if (learningTab) window.activateSection(learningTab);

        if (lastSkillGapAnalysis) {

            applyLearningPlan(buildLearningPlan(lastSkillGapAnalysis.role));

            showDashboardToast(
                `Learning plan built from your Skill Gap results for ${lastSkillGapAnalysis.role}.`,
                "success"
            );

        }

    });

}
/* ===========================
   LEARNING PLANNER AGENT
=========================== */

// ---------- Per-role default curriculum ----------
// Used as a sensible fallback when the Learning Planner is opened
// without having run a Skill Gap analysis first.

const learningRoleProfiles = {

    "AI Engineer": {
        high: ["Docker", "AWS", "System Design"],
        medium: ["TensorFlow", "SQL"],
        low: ["GitHub Actions", "Linux"],
        weeks: [
            "Docker + Linux Basics",
            "AWS Fundamentals",
            "System Design + SQL",
            "Build AI Deployment Project"
        ],
        totalWeeks: 8,
        defaultReadiness: 63
    },

    "Machine Learning Engineer": {
        high: ["MLOps", "Docker", "AWS"],
        medium: ["Pandas", "SQL"],
        low: ["GitHub Actions", "Linux"],
        weeks: [
            "MLOps Fundamentals",
            "Docker + Model Serving",
            "AWS for ML Workloads",
            "Build & Deploy an ML Pipeline"
        ],
        totalWeeks: 8,
        defaultReadiness: 60
    },

    "Software Engineer": {
        high: ["System Design", "Testing", "Cloud Deployment"],
        medium: ["SQL", "REST APIs"],
        low: ["Linux", "GitHub Actions"],
        weeks: [
            "System Design Foundations",
            "Automated Testing Practices",
            "Cloud Deployment Basics",
            "Build a Full Deployment Pipeline"
        ],
        totalWeeks: 7,
        defaultReadiness: 65
    },

    "Data Scientist": {
        high: ["Spark", "A/B Testing", "Model Deployment"],
        medium: ["Pandas", "Visualization"],
        low: ["Linux", "SQL Tuning"],
        weeks: [
            "Big Data Tools (Spark)",
            "Experiment Design + A/B Testing",
            "Model Deployment Basics",
            "Build an End-to-End Analysis Project"
        ],
        totalWeeks: 8,
        defaultReadiness: 58
    },

    "Backend Developer": {
        high: ["System Design", "Docker", "Redis"],
        medium: ["REST APIs", "PostgreSQL"],
        low: ["Linux", "GitHub Actions"],
        weeks: [
            "System Design Foundations",
            "Docker + Containerization",
            "Caching with Redis",
            "Build a Production-Ready API"
        ],
        totalWeeks: 7,
        defaultReadiness: 66
    },

    "Full Stack Developer": {
        high: ["Testing", "Docker", "System Design"],
        medium: ["HTML", "CSS"],
        low: ["Linux", "GitHub Actions"],
        weeks: [
            "Automated Testing (Frontend + Backend)",
            "Docker + Containerization",
            "System Design for Web Apps",
            "Build & Deploy a Full-Stack Project"
        ],
        totalWeeks: 7,
        defaultReadiness: 62
    }

};

// Shared skill → resource lookup, matched against whichever
// skills actually appear in the generated priority lists.

const learningResourceLibrary = {

    "docker": { title: "Docker", resource: "Docker Official Documentation" },
    "aws": { title: "AWS", resource: "AWS Skill Builder" },
    "system design": { title: "System Design", resource: "System Design Primer" },
    "sql": { title: "SQL", resource: "SQLBolt" },
    "tensorflow": { title: "TensorFlow", resource: "TensorFlow Official Tutorials" },
    "kubernetes": { title: "Kubernetes", resource: "Kubernetes Official Docs" },
    "mlops": { title: "MLOps", resource: "Made With ML — MLOps Course" },
    "pandas": { title: "Pandas", resource: "Pandas Official Documentation" },
    "testing": { title: "Testing", resource: "Test Automation University" },
    "cloud deployment": { title: "Cloud Deployment", resource: "AWS / GCP Deployment Guides" },
    "rest apis": { title: "REST APIs", resource: "REST API Design Best Practices" },
    "redis": { title: "Redis", resource: "Redis Official Documentation" },
    "postgresql": { title: "PostgreSQL", resource: "PostgreSQL Tutorial" },
    "spark": { title: "Spark", resource: "Apache Spark Official Docs" },
    "a/b testing": { title: "A/B Testing", resource: "Udacity — A/B Testing Course" },
    "visualization": { title: "Visualization", resource: "Storytelling with Data" },
    "html": { title: "HTML", resource: "MDN Web Docs — HTML" },
    "css": { title: "CSS", resource: "MDN Web Docs — CSS" },
    "linux": { title: "Linux", resource: "Linux Journey" },
    "github actions": { title: "GitHub Actions", resource: "GitHub Actions Documentation" }

};

function buildLearningPlan(role) {

    const profile = learningRoleProfiles[role] || learningRoleProfiles["AI Engineer"];

    // Prefer live Skill Gap results for this exact role, if available
    const usingLiveData = !!(
        typeof lastSkillGapAnalysis !== "undefined" &&
        lastSkillGapAnalysis &&
        lastSkillGapAnalysis.role === role
    );

    const high = usingLiveData && lastSkillGapAnalysis.missing.length
        ? lastSkillGapAnalysis.missing.slice(0, 3)
        : profile.high;

    const medium = usingLiveData && lastSkillGapAnalysis.partial.length
        ? lastSkillGapAnalysis.partial
        : profile.medium;

    const low = profile.low;

    const readiness = usingLiveData ? lastSkillGapAnalysis.score : profile.defaultReadiness;

    // Resources: look up whichever skills actually ended up in the lists
    const resourceSkills = [...new Set([...high, ...medium])];

    const resources = resourceSkills.map(skill => {

        const match = learningResourceLibrary[skill.toLowerCase()];

        return match || { title: skill, resource: "Explore official docs and community tutorials" };

    });

    return {
        role,
        high,
        medium,
        low,
        weeks: profile.weeks,
        totalWeeks: profile.totalWeeks,
        readiness,
        resources,
        usingLiveData
    };

}

let lastLearningPlan = null; // read by the LangGraph Orchestrator to detect completion

function applyLearningPlan(plan) {

    lastLearningPlan = plan;

    const targetRoleEl = document.getElementById("learningTargetRole");
    const roleSourceEl = document.getElementById("learningRoleSource");

    if (targetRoleEl) targetRoleEl.textContent = plan.role;

    if (roleSourceEl) {

        roleSourceEl.textContent = plan.usingLiveData
            ? `Personalized from your Skill Gap analysis for ${plan.role}.`
            : `Showing a default roadmap for ${plan.role}. Run a Skill Gap analysis for a plan tailored to your actual gaps.`;

    }

    renderSkillChips("highPrioritySkills", plan.high);
    renderSkillChips("mediumPrioritySkills", plan.medium);
    renderSkillChips("lowPrioritySkills", plan.low);

    const weeklyList = document.getElementById("weeklyRoadmapList");

    if (weeklyList) {

        weeklyList.innerHTML = plan.weeks.map((task, i) =>
            `<div class="goal-item"><strong>Week ${i + 1}</strong><span>${task}</span></div>`
        ).join("");

    }

    const resourcesList = document.getElementById("learningResourcesList");

    if (resourcesList) {

        resourcesList.innerHTML = plan.resources.map(r =>
            `<div class="candidate-box"><h3>${r.title}</h3><p>${r.resource}</p></div>`
        ).join("");

    }

    const timelineProgress = document.getElementById("timelineProgress");
    const timelineReadinessLabel = document.getElementById("timelineReadinessLabel");
    const timelineWeeksText = document.getElementById("timelineWeeksText");

    if (timelineProgress) {

        timelineProgress.style.width = `${plan.readiness}%`;
        timelineProgress.closest(".progress")?.setAttribute("aria-valuenow", plan.readiness);

    }

    if (timelineReadinessLabel) timelineReadinessLabel.textContent = `${plan.readiness}%`;
    if (timelineWeeksText) timelineWeeksText.textContent = `${plan.totalWeeks} Weeks`;

    const finalActionPlanText = document.getElementById("finalActionPlanText");

    if (finalActionPlanText) {

        finalActionPlanText.textContent =
            `Focus on ${plan.high[0] || "your top priority skill"} first, then ${plan.high[1] || "the rest of your high-priority list"}. ` +
            `Finish one deployment project, solve DSA regularly, practice mock interviews every week, ` +
            `and update your resume after completing this roadmap for ${plan.role}.`;

    }

}

const roadmapBtn = document.getElementById("generateRoadmap");

if (roadmapBtn) {

    const roadmapDefaultLabel = roadmapBtn.textContent;

    roadmapBtn.addEventListener("click", () => {

        const roleSelect = document.getElementById("jobRole");
        const selectedRole = (roleSelect && roleSelect.value) || "AI Engineer";

        roadmapBtn.disabled = true;
        roadmapBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...';

        // ===============================
        // BACKEND INTEGRATION
        // ===============================
        // Real endpoint: POST /agents/learning-plan (RAG-backed, no auth
        // required). Needs resume_info + skill_gap + target_role — i.e. it
        // depends on having run the Skill Gap agent for this role first.
        // Falls back to the local generic roadmap otherwise.

        function finishRoadmap() {
            roadmapBtn.disabled = false;
            roadmapBtn.textContent = roadmapDefaultLabel;
        }

        const haveLiveSkillGap = lastSkillGapAnalysis
            && lastSkillGapAnalysis.role === selectedRole
            && lastSkillGapRaw
            && lastResumeInfoForAgents;

        if (!haveLiveSkillGap) {

            setTimeout(() => {

                applyLearningPlan(buildLearningPlan(selectedRole));
                finishRoadmap();

                showDashboardToast(`Learning plan generated for ${selectedRole}. Run Skill Gap first for a live, AI-personalized version.`, "success");
                window.logActivity?.(`Learning plan generated for ${selectedRole}.`, "fa-book-open");

            }, 1300);

            return;
        }

        apiFetch("/agents/learning-plan", {
            method: "POST",
            body: {
                resume_info: lastResumeInfoForAgents,
                skill_gap: lastSkillGapRaw,
                target_role: selectedRole
            }
        })
            .then((json) => {

                const data = json.data;
                const phases = data.learning_plan || [];
                const fallbackProfile = learningRoleProfiles[selectedRole] || learningRoleProfiles["AI Engineer"];

                const resourceSkills = [...new Set(
                    phases.flatMap(p => p.focus_skills || [])
                )];

                const resources = resourceSkills.length
                    ? resourceSkills.map(skill => learningResourceLibrary[skill.toLowerCase()] || { title: skill, resource: "Explore official docs and community tutorials" })
                    : fallbackProfile.low.map(skill => learningResourceLibrary[skill.toLowerCase()] || { title: skill, resource: "Explore official docs and community tutorials" });

                applyLearningPlan({
                    role: data.target_role || selectedRole,
                    high: (data.priority_skills_to_learn || []).slice(0, 3),
                    medium: phases[1] ? (phases[1].focus_skills || []) : fallbackProfile.medium,
                    low: fallbackProfile.low,
                    weeks: phases.length
                        ? phases.map(p => `${p.phase}: ${(p.topics || []).join(", ")}`)
                        : fallbackProfile.weeks,
                    totalWeeks: phases.length || fallbackProfile.totalWeeks,
                    readiness: lastSkillGapAnalysis.score,
                    resources,
                    usingLiveData: true
                });

                finishRoadmap();

                showDashboardToast(`AI-personalized learning plan generated for ${selectedRole}.`, "success");
                window.logActivity?.(`Learning plan generated for ${selectedRole}.`, "fa-book-open");

            })
            .catch((err) => {

                console.error(err);

                applyLearningPlan(buildLearningPlan(selectedRole));
                finishRoadmap();

                showDashboardToast(`Live learning-plan API unavailable, showing local estimate for ${selectedRole}.`, "error");
                window.logActivity?.(`Learning plan generated for ${selectedRole}.`, "fa-book-open");

            });

    });

}
/* ===========================
   RESUME ANALYZER AGENT
=========================== */

// ---------- Shared toast helper (dashboard-flavored) ----------
// Introduced here so Resume Analyzer feedback doesn't rely on
// jarring native alert() dialogs. Safe for other sections to reuse
// as they're modernized in later phases.

function showDashboardToast(message, type = "success") {

    let toast = document.querySelector(".toast");

    if (!toast) {

        toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);

    }

    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i><span>${message}</span>`;
    toast.className = `toast show ${type}`;

    clearTimeout(toast._hideTimer);

    toast._hideTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3200);

}


const analyzeResumeBtn = document.getElementById("analyzeResume");
const uploadResumeBtn = document.getElementById("uploadResume");
const resumeFileInput = document.getElementById("resumeFile");
const downloadReportBtn = document.getElementById("downloadReport");
const uploadDropzone = document.getElementById("uploadDropzone");
const uploadFileChip = document.getElementById("uploadFileChip");
const uploadFileName = document.getElementById("uploadFileName");
const uploadFileSize = document.getElementById("uploadFileSize");
const uploadFileRemove = document.getElementById("uploadFileRemove");
const analyzeHint = document.getElementById("analyzeHint");

const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

let currentResumeFile = null;
let lastAnalysis = null; // populated after a successful "Analyze Resume" run

function formatFileSize(bytes) {

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}

function setResumeFile(file) {

    const isPdf = file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {

        showDashboardToast("Please upload a PDF file.", "error");
        return;

    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {

        showDashboardToast("That file is over 5MB. Please upload a smaller PDF.", "error");
        return;

    }

    currentResumeFile = file;

    if (uploadFileName) uploadFileName.textContent = file.name;
    if (uploadFileSize) uploadFileSize.textContent = formatFileSize(file.size);
    if (uploadFileChip) uploadFileChip.hidden = false;

    if (analyzeResumeBtn) analyzeResumeBtn.disabled = false;
    if (analyzeHint) analyzeHint.textContent = "Ready to analyze whenever you are.";

    showDashboardToast(`${file.name} uploaded successfully.`, "success");

}

function clearResumeFile() {

    currentResumeFile = null;

    if (resumeFileInput) resumeFileInput.value = "";
    if (uploadFileChip) uploadFileChip.hidden = true;
    if (analyzeResumeBtn) analyzeResumeBtn.disabled = true;
    if (analyzeHint) analyzeHint.textContent = "Upload a resume above to enable analysis.";

}

// Upload Resume — click to browse

if (uploadResumeBtn && resumeFileInput) {

    uploadResumeBtn.addEventListener("click", (e) => {

        e.stopPropagation();
        resumeFileInput.click();

    });

    resumeFileInput.addEventListener("change", () => {

        if (resumeFileInput.files.length > 0) {

            setResumeFile(resumeFileInput.files[0]);

        }

    });

}

// Upload Resume — drag & drop

if (uploadDropzone) {

    uploadDropzone.addEventListener("click", () => {

        resumeFileInput?.click();

    });

    ["dragenter", "dragover"].forEach(evt => {

        uploadDropzone.addEventListener(evt, (e) => {

            e.preventDefault();
            uploadDropzone.classList.add("dragover");

        });

    });

    ["dragleave", "drop"].forEach(evt => {

        uploadDropzone.addEventListener(evt, (e) => {

            e.preventDefault();
            uploadDropzone.classList.remove("dragover");

        });

    });

    uploadDropzone.addEventListener("drop", (e) => {

        const file = e.dataTransfer.files?.[0];

        if (file) setResumeFile(file);

    });

}

if (uploadFileRemove) {

    uploadFileRemove.addEventListener("click", (e) => {

        e.stopPropagation();
        clearResumeFile();

    });

}


// ---------- Role-based mock analysis data ----------
// Stands in for a real backend response. Swap out for the fetch()
// integration below once the Resume Analyzer API is available.

const resumeRoleProfiles = {

    "AI Engineer": {
        score: 91,
        strengths: ["Python", "FastAPI", "TensorFlow", "Git", "HTML"],
        weaknesses: ["System Design", "Docker", "AWS"],
        missing: ["Kubernetes", "CI/CD", "Microservices"],
        summary: "Your resume demonstrates strong programming and AI fundamentals. Adding cloud technologies, deployment experience, quantified project achievements, and system design concepts will significantly improve your resume for this role.",
        ats: 90, skills: 80, project: 70, overall: 90
    },

    "Machine Learning Engineer": {
        score: 87,
        strengths: ["Python", "PyTorch", "Scikit-learn", "SQL", "Pandas"],
        weaknesses: ["MLOps", "Docker", "Model Monitoring"],
        missing: ["Kubeflow", "Airflow", "Feature Stores"],
        summary: "Solid ML fundamentals and data handling skills come through clearly. Strengthening MLOps practices and showing evidence of models running in production would make this resume more competitive.",
        ats: 85, skills: 78, project: 68, overall: 84
    },

    "Software Engineer": {
        score: 84,
        strengths: ["Java", "Data Structures", "REST APIs", "Git", "SQL"],
        weaknesses: ["System Design", "Testing", "Cloud Deployment"],
        missing: ["CI/CD", "Design Patterns", "Load Balancing"],
        summary: "You show solid core engineering fundamentals. Adding measurable impact statements and any experience with large-scale system design would strengthen this resume considerably.",
        ats: 82, skills: 76, project: 65, overall: 81
    },

    "Backend Developer": {
        score: 88,
        strengths: ["Node.js", "Express", "PostgreSQL", "REST APIs", "Git"],
        weaknesses: ["System Design", "Caching", "Message Queues"],
        missing: ["Docker", "Kubernetes", "Redis"],
        summary: "Your backend fundamentals and API experience are strong. Demonstrating experience with caching, queues, and containerized deployment would round this out nicely for backend-focused roles.",
        ats: 88, skills: 82, project: 72, overall: 86
    },

    "Data Scientist": {
        score: 83,
        strengths: ["Python", "Pandas", "SQL", "Statistics", "Visualization"],
        weaknesses: ["A/B Testing", "Big Data Tools", "Model Deployment"],
        missing: ["Spark", "Airflow", "Experiment Design"],
        summary: "Strong statistical and analytical foundation. Adding experience with large-scale data tools and showing how your analysis influenced real decisions would make this resume more compelling.",
        ats: 80, skills: 74, project: 66, overall: 79
    },

    "Full Stack Developer": {
        score: 89,
        strengths: ["JavaScript", "React", "Node.js", "MongoDB", "Git"],
        weaknesses: ["Testing", "System Design", "DevOps"],
        missing: ["Docker", "CI/CD", "GraphQL"],
        summary: "Your resume shows well-rounded frontend and backend experience. Adding automated testing and deployment pipeline experience would make this an even stronger full-stack profile.",
        ats: 87, skills: 81, project: 73, overall: 85
    }

};

function renderSkillChips(containerId, items) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = items.map(item => `<span>${item}</span>`).join("");

}

function applyResumeAnalysis(role, data) {

    // Score circle
    const scoreCircle = document.getElementById("scoreCircle");
    const scoreValue = document.getElementById("scoreValue");

    if (scoreCircle) {

        scoreCircle.style.setProperty("--score", data.score);
        scoreCircle.setAttribute("aria-label", `Role fit score: ${data.score} percent`);

    }

    if (scoreValue) scoreValue.textContent = `${data.score}%`;

    // Skill chips
    renderSkillChips("strengthsList", data.strengths);
    renderSkillChips("weaknessesList", data.weaknesses);
    renderSkillChips("missingKeywordsList", data.missing);

    // Summary
    const summaryEl = document.getElementById("aiSummaryText");
    if (summaryEl) summaryEl.textContent = data.summary;

    // Progress bars
    const bars = [
        ["atsProgress", "atsPercentLabel", data.ats, "ATS Compatibility"],
        ["skillsProgress", "skillsPercentLabel", data.skills, "Technical Skills Match"],
        ["projectProgress", "projectPercentLabel", data.project, "Project Quality"],
        ["overallProgress", "overallPercentLabel", data.overall, "Overall Resume Quality"],
    ];

    bars.forEach(([fillId, labelId, value]) => {

        const fill = document.getElementById(fillId);
        const label = document.getElementById(labelId);

        if (fill) {

            fill.style.width = `${value}%`;
            fill.closest(".progress")?.setAttribute("aria-valuenow", value);

        }

        if (label) label.textContent = `${value}%`;

    });

    lastAnalysis = { role, ...data };

}

// Download Report — generates a real text report client-side.
// Swap for a backend-rendered PDF once that endpoint exists.

if (downloadReportBtn) {

    const downloadDefaultLabel = downloadReportBtn.textContent;

    downloadReportBtn.addEventListener("click", () => {

        const role = document.getElementById("resumeRole")?.value || "Target Role";

        const data = lastAnalysis || {

            role,
            score: document.getElementById("scoreValue")?.textContent.replace("%", "") || "—",
            strengths: [...document.querySelectorAll("#strengthsList span")].map(s => s.textContent),
            weaknesses: [...document.querySelectorAll("#weaknessesList span")].map(s => s.textContent),
            missing: [...document.querySelectorAll("#missingKeywordsList span")].map(s => s.textContent),
            summary: document.getElementById("aiSummaryText")?.textContent.trim(),
            ats: document.getElementById("atsPercentLabel")?.textContent,
            skills: document.getElementById("skillsPercentLabel")?.textContent,
            project: document.getElementById("projectPercentLabel")?.textContent,
            overall: document.getElementById("overallPercentLabel")?.textContent

        };

        downloadReportBtn.disabled = true;
        downloadReportBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Preparing...';

        setTimeout(() => {

            const reportText =
`AI HELPDESK AGENT — RESUME ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
Target Role: ${data.role || role}

ROLE FIT SCORE: ${data.score}%

STRENGTHS
${(data.strengths || []).map(s => ` - ${s}`).join("\n")}

WEAKNESSES
${(data.weaknesses || []).map(s => ` - ${s}`).join("\n")}

MISSING KEYWORDS
${(data.missing || []).map(s => ` - ${s}`).join("\n")}

AI SUMMARY
${data.summary || ""}

ANALYSIS REPORT
 - ATS Compatibility: ${data.ats}
 - Technical Skills Match: ${data.skills}
 - Project Quality: ${data.project}
 - Overall Resume Quality: ${data.overall}
`;

            const blob = new Blob([reportText], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `Resume_Analysis_Report_${(data.role || role).replace(/\s+/g, "_")}.txt`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            downloadReportBtn.disabled = false;
            downloadReportBtn.textContent = downloadDefaultLabel;

            showDashboardToast("Analysis report downloaded.", "success");

        }, 600);

    });

}
/* ===========================
   INTERVIEW COACH AGENT
=========================== */

// ---------- Question bank ----------
// 2 questions per role per difficulty. Stands in for a real backend
// response — swap for the fetch() integration below once the
// Interview Coach API exists.

const interviewQuestionBank = {

    "AI Engineer": {
        Easy: [
            { text: "What is the difference between supervised and unsupervised learning?", keywords: ["labeled", "unlabeled", "supervised", "unsupervised", "classification", "clustering"], ideal: "Supervised learning uses labeled data to learn a mapping from inputs to outputs, such as classification or regression. Unsupervised learning finds patterns in unlabeled data, such as clustering or dimensionality reduction." },
            { text: "What is overfitting and how can you prevent it?", keywords: ["overfitting", "regularization", "training", "validation", "generalize", "dropout"], ideal: "Overfitting happens when a model learns noise in the training data and performs poorly on unseen data. It can be prevented with regularization, cross-validation, more data, or techniques like dropout." }
        ],
        Medium: [
            { text: "Explain the bias-variance tradeoff.", keywords: ["bias", "variance", "underfitting", "overfitting", "tradeoff", "complexity"], ideal: "Bias is error from overly simplistic assumptions, causing underfitting. Variance is error from sensitivity to training data, causing overfitting. The tradeoff involves balancing model complexity to minimize total error." },
            { text: "How would you handle an imbalanced dataset in a classification problem?", keywords: ["imbalanced", "oversampling", "undersampling", "smote", "class weights", "precision", "recall"], ideal: "Techniques include oversampling the minority class (e.g. SMOTE), undersampling the majority class, adjusting class weights, and evaluating with precision/recall/F1 instead of accuracy alone." }
        ],
        Hard: [
            { text: "How would you design a system to serve a machine learning model in production at scale?", keywords: ["api", "latency", "scaling", "monitoring", "versioning", "deployment", "inference"], ideal: "Wrap the model in an inference API (e.g. FastAPI), containerize it, use autoscaling behind a load balancer, add monitoring for latency and drift, and support model versioning for safe rollouts." },
            { text: "Explain how you would debug a model that performs well in training but poorly in production.", keywords: ["drift", "distribution", "monitoring", "skew", "logging"], ideal: "Check for training-serving skew, data drift between training and production distributions, feature pipeline mismatches, and add logging/monitoring to compare live predictions against expectations." }
        ]
    },

    "Machine Learning Engineer": {
        Easy: [
            { text: "What is the difference between classification and regression?", keywords: ["classification", "regression", "discrete", "continuous", "labels"], ideal: "Classification predicts discrete categories or classes, while regression predicts continuous numeric values." },
            { text: "What is cross-validation and why is it used?", keywords: ["cross-validation", "k-fold", "generalization", "overfitting"], ideal: "Cross-validation splits data into multiple folds to train and validate a model repeatedly, giving a more reliable estimate of how it generalizes to unseen data." }
        ],
        Medium: [
            { text: "What is feature engineering and why does it matter?", keywords: ["feature engineering", "transform", "domain knowledge", "performance"], ideal: "Feature engineering is transforming raw data into informative inputs for a model, often using domain knowledge — it can significantly improve model performance beyond just tuning algorithms." },
            { text: "Compare bagging and boosting.", keywords: ["bagging", "boosting", "ensemble", "variance", "bias", "random forest", "gradient boosting"], ideal: "Bagging trains models in parallel on random subsets to reduce variance (e.g. Random Forest). Boosting trains models sequentially, each correcting the previous one's errors, reducing bias (e.g. Gradient Boosting)." }
        ],
        Hard: [
            { text: "How would you set up an MLOps pipeline for continuous model retraining?", keywords: ["mlops", "pipeline", "retraining", "ci/cd", "monitoring", "versioning"], ideal: "Automate data validation, training, evaluation, and deployment as a CI/CD pipeline, with model versioning, monitoring for performance/drift, and triggers to retrain when metrics degrade." },
            { text: "How do you monitor a deployed model for data drift?", keywords: ["drift", "monitoring", "distribution", "statistical", "alerts"], ideal: "Track statistical distributions of incoming features versus training data, use tests like KS-statistics or PSI, and set up alerts when drift exceeds a threshold." }
        ]
    },

    "Software Engineer": {
        Easy: [
            { text: "What is the difference between an array and a linked list?", keywords: ["array", "linked list", "memory", "contiguous", "pointer"], ideal: "Arrays store elements in contiguous memory with O(1) index access. Linked lists store elements as nodes with pointers, allowing O(1) insertion/deletion but O(n) access." },
            { text: "What is Big O notation and why is it important?", keywords: ["big o", "time complexity", "space complexity", "efficiency"], ideal: "Big O notation describes how an algorithm's time or space requirements grow with input size, helping compare algorithm efficiency independent of hardware." }
        ],
        Medium: [
            { text: "Explain the SOLID principles.", keywords: ["solid", "single responsibility", "open closed", "liskov", "interface segregation", "dependency inversion"], ideal: "SOLID stands for Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion — five principles for writing maintainable, extensible object-oriented code." },
            { text: "How would you design a rate limiter?", keywords: ["rate limiter", "token bucket", "sliding window", "throttling"], ideal: "Common approaches include the token bucket or sliding window algorithms, tracking request counts per client in a fast store like Redis, and rejecting or throttling requests beyond the limit." }
        ],
        Hard: [
            { text: "How would you design a URL shortening service like bit.ly?", keywords: ["hashing", "database", "scalability", "load balancing", "caching"], ideal: "Generate a short unique key (via hashing or a counter), store the mapping in a database, add caching for frequently accessed URLs, and scale reads with load balancing and replication." },
            { text: "How do you approach debugging a memory leak in a long-running service?", keywords: ["memory leak", "profiling", "garbage collection", "heap", "monitoring"], ideal: "Use profiling tools to take heap snapshots over time, look for objects that keep growing, check for unclosed references/listeners, and add monitoring to catch leaks early in production." }
        ]
    },

    "Backend Developer": {
        Easy: [
            { text: "What is REST and what makes an API RESTful?", keywords: ["rest", "stateless", "http methods", "resources"], ideal: "REST is an architectural style using stateless HTTP requests and standard methods (GET, POST, PUT, DELETE) to operate on resources identified by URLs." },
            { text: "What is the difference between SQL and NoSQL databases?", keywords: ["sql", "nosql", "relational", "schema", "scalability"], ideal: "SQL databases are relational with fixed schemas and strong consistency, good for structured data. NoSQL databases are more flexible/schema-less and often easier to scale horizontally." }
        ],
        Medium: [
            { text: "How would you design database indexes to improve query performance?", keywords: ["index", "query performance", "b-tree", "composite index"], ideal: "Add indexes (commonly B-tree) on columns used frequently in WHERE/JOIN clauses, consider composite indexes for multi-column queries, and balance query speed against write overhead." },
            { text: "Explain how you would implement authentication and authorization in an API.", keywords: ["authentication", "authorization", "jwt", "oauth", "sessions"], ideal: "Authentication verifies identity, often via JWTs or sessions; authorization checks what an authenticated user is allowed to do, typically via roles or permissions checked on each request." }
        ],
        Hard: [
            { text: "How would you design a system to handle millions of concurrent API requests?", keywords: ["load balancing", "horizontal scaling", "caching", "queue", "microservices"], ideal: "Scale horizontally behind a load balancer, cache hot data, use message queues to smooth spikes, and split into microservices so components can scale independently." },
            { text: "How do you ensure data consistency across microservices?", keywords: ["consistency", "distributed transactions", "saga", "eventual consistency"], ideal: "Avoid distributed transactions where possible; use patterns like the Saga pattern for multi-step workflows, and design for eventual consistency with idempotent operations and compensating actions." }
        ]
    },

    "Data Scientist": {
        Easy: [
            { text: "What is the difference between correlation and causation?", keywords: ["correlation", "causation", "confounding"], ideal: "Correlation means two variables move together, but doesn't imply one causes the other — a confounding variable or coincidence could explain the relationship instead." },
            { text: "What is A/B testing and when would you use it?", keywords: ["a/b testing", "hypothesis", "control group", "statistical significance"], ideal: "A/B testing compares two variants by randomly assigning users to a control and treatment group, then measuring which performs better with statistical significance." }
        ],
        Medium: [
            { text: "How do you handle missing data in a dataset?", keywords: ["missing data", "imputation", "drop", "mean", "median"], ideal: "Options include dropping rows/columns with too much missing data, imputing with mean/median/mode, or using model-based imputation — the right choice depends on how much and why data is missing." },
            { text: "Explain p-values and statistical significance.", keywords: ["p-value", "significance", "null hypothesis", "confidence interval"], ideal: "A p-value is the probability of observing a result as extreme as the data, assuming the null hypothesis is true. A small p-value (commonly < 0.05) suggests the result is statistically significant." }
        ],
        Hard: [
            { text: "How would you design an experiment to measure the causal impact of a new feature?", keywords: ["experiment", "causal", "randomization", "control", "a/b test"], ideal: "Randomly assign users to control and treatment groups (an A/B test), ensure sample sizes are large enough for statistical power, and isolate the feature as the only difference between groups." },
            { text: "How would you build a forecasting model for seasonal sales data?", keywords: ["time series", "seasonality", "forecasting", "arima", "trend"], ideal: "Decompose the series into trend, seasonality, and residual components, then use a time-series model like ARIMA or Prophet that accounts for seasonality to forecast future values." }
        ]
    }

};


// ---------- DOM references ----------

const startInterviewBtn = document.getElementById("startInterview");
const submitAnswerBtn = document.getElementById("submitAnswer");
const questionText = document.getElementById("questionText");
const candidateAnswer = document.getElementById("candidateAnswer");
const interviewNextBtn = document.getElementById("interviewNextBtn");
const micRecordBtn = document.getElementById("micRecordBtn");
const voiceStatus = document.getElementById("voiceStatus");
const saveInterviewReportBtn = document.getElementById("saveInterviewReport");

let interviewSession = null; // { role, difficulty, questions, currentIndex, responses }


// ---------- Speech-to-Text (Web Speech API) ----------

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognitionAPI) {

    recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.addEventListener("result", (e) => {

        let finalTranscript = "";

        for (let i = e.resultIndex; i < e.results.length; i++) {

            if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;

        }

        if (finalTranscript && candidateAnswer) {

            candidateAnswer.value = (candidateAnswer.value + " " + finalTranscript).trim();

        }

    });

    recognition.addEventListener("end", () => {

        isRecording = false;
        micRecordBtn?.classList.remove("recording");
        micRecordBtn?.setAttribute("aria-pressed", "false");
        if (micRecordBtn) micRecordBtn.innerHTML = '<i class="fa-solid fa-microphone" aria-hidden="true"></i> Record Answer';
        if (voiceStatus) voiceStatus.textContent = "";

    });

    recognition.addEventListener("error", () => {

        if (voiceStatus) voiceStatus.textContent = "Voice recognition error — please try again or type your answer.";

    });

}

if (micRecordBtn) {

    if (!SpeechRecognitionAPI) {

        micRecordBtn.addEventListener("click", () => {

            showDashboardToast("Voice input isn't supported in this browser. Please type your answer instead.", "error");

        });

    } else {

        micRecordBtn.addEventListener("click", () => {

            if (isRecording) {

                recognition.stop();

            } else {

                isRecording = true;
                micRecordBtn.classList.add("recording");
                micRecordBtn.setAttribute("aria-pressed", "true");
                micRecordBtn.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i> Stop Recording';
                if (voiceStatus) voiceStatus.textContent = "Listening — speak your answer now...";

                try {

                    recognition.start();

                } catch (err) {

                    // Already started — ignore.

                }

            }

        });

    }

}


// ---------- Answer evaluation ----------

function evaluateAnswer(answer, question) {

    const lowerAnswer = answer.toLowerCase();
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

    const keywordHits = question.keywords.filter(k => lowerAnswer.includes(k)).length;
    const missingKeywords = question.keywords.filter(k => !lowerAnswer.includes(k));

    const technical = Math.round(Math.min(100, (keywordHits / question.keywords.length) * 100));
    const communication = Math.round(Math.min(100, wordCount * 3));

    const hedgeWords = ["um", "i don't know", "not sure", "maybe", "i guess"];
    const hedgeHits = hedgeWords.filter(h => lowerAnswer.includes(h)).length;
    const confidence = Math.round(Math.max(20, Math.min(100, 85 - hedgeHits * 20 + Math.min(wordCount, 30))));

    const overall = Math.round((technical + communication + confidence) / 3);

    const strengths = [];
    const weaknesses = [];

    if (technical >= 70) strengths.push("Covered the key technical concepts well.");
    else weaknesses.push(`Missing some key concepts — consider mentioning: ${missingKeywords.slice(0, 3).join(", ") || "more specifics"}.`);

    if (communication >= 60) strengths.push("Explained the answer with good detail and structure.");
    else weaknesses.push("Answer could be more detailed and structured.");

    if (confidence >= 70) strengths.push("Answered with confidence and clarity.");
    else weaknesses.push("Answer read as hesitant — try stating points more assertively.");

    if (strengths.length === 0) strengths.push("Attempted the question directly.");

    const suggestion = technical < 70
        ? `Review the core concepts behind this question and try to include specific terminology like ${missingKeywords.slice(0, 2).join(" or ") || "relevant terms"}.`
        : communication < 60
            ? "Try structuring your answer with a clear beginning, explanation, and example."
            : "Strong answer — keep reinforcing this with real project examples in future interviews.";

    return { technical, communication, confidence, overall, strengths, weaknesses, suggestion, ideal: question.ideal };

}


// ---------- Session flow ----------

function resetAnswerUI() {

    if (candidateAnswer) candidateAnswer.value = "";

    ["interviewScoresCard", "interviewFeedbackCard", "idealAnswerCard", "interviewNextCard"].forEach(id => {

        const el = document.getElementById(id);
        if (el) el.hidden = true;

    });

    if (submitAnswerBtn) submitAnswerBtn.hidden = false;

}

function showQuestion() {

    const q = interviewSession.questions[interviewSession.currentIndex];

    if (questionText) questionText.textContent = q.text;

    const progressText = document.getElementById("interviewProgressText");

    if (progressText) {

        progressText.textContent = `Question ${interviewSession.currentIndex + 1} of ${interviewSession.questions.length}`;

    }

    resetAnswerUI();

    document.getElementById("interviewQuestionCard").hidden = false;
    document.getElementById("interviewAnswerCard").hidden = false;

    document.getElementById("interviewQuestionCard").scrollIntoView({ behavior: "smooth", block: "start" });

}

if (startInterviewBtn) {

    startInterviewBtn.addEventListener("click", () => {

        const role = document.getElementById("interviewRole").value;
        const difficulty = document.getElementById("difficultyLevel").value;

        const questions = (interviewQuestionBank[role] && interviewQuestionBank[role][difficulty]) || [];

        if (questions.length === 0) {

            showDashboardToast("No questions available for that combination yet.", "error");
            return;

        }

        interviewSession = {
            role,
            difficulty,
            questions,
            currentIndex: 0,
            responses: []
        };

        document.getElementById("finalReportCard").hidden = true;

        showQuestion();

        showDashboardToast(`Interview started — ${role} (${difficulty}).`, "success");

    });

}

if (submitAnswerBtn) {

    submitAnswerBtn.addEventListener("click", () => {

        const answer = candidateAnswer.value.trim();

        if (!answer) {

            showDashboardToast("Please enter or record your answer.", "error");
            return;

        }

        if (!interviewSession) return;

        const question = interviewSession.questions[interviewSession.currentIndex];
        const result = evaluateAnswer(answer, question);

        interviewSession.responses.push({ question: question.text, answer, ...result });

        // ===============================
        // BACKEND INTEGRATION — NOT WIRED
        // ===============================
        // Unlike the other agents in this file, there is currently no
        // interview-evaluation endpoint anywhere in backend/app (an
        // interview_agent.py exists only in the separate /app backend,
        // which is out of scope). Left as local scoring until a real
        // endpoint exists.
        //
        // fetch("/api/evaluate-answer", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ question: question.text, answer })
        // })
        // .then(res => res.json())
        // .then(data => applyAnswerFeedback(data))
        // .catch(() => showDashboardToast("Couldn't evaluate your answer. Please try again.", "error"));

        // Scores
        const scoreCircle = document.getElementById("interviewScoreCircle");
        const scoreValue = document.getElementById("interviewScoreValue");

        if (scoreCircle) scoreCircle.style.setProperty("--score", result.overall);
        if (scoreValue) scoreValue.textContent = `${result.overall}%`;

        [
            ["technicalProgress", result.technical],
            ["communicationProgress", result.communication],
            ["confidenceProgress", result.confidence]
        ].forEach(([id, value]) => {

            const fill = document.getElementById(id);

            if (fill) {

                fill.style.width = `${value}%`;
                fill.closest(".progress")?.setAttribute("aria-valuenow", value);

            }

        });

        document.getElementById("interviewScoresCard").hidden = false;

        // Feedback
        renderList("interviewStrengthsList", result.strengths);
        renderList("interviewWeaknessesList", result.weaknesses);
        document.getElementById("interviewSuggestionsText").textContent = result.suggestion;
        document.getElementById("interviewFeedbackCard").hidden = false;

        // Ideal answer
        document.getElementById("idealAnswerText").textContent = result.ideal;
        document.getElementById("idealAnswerCard").hidden = false;

        // Next question / final report branch
        const isLastQuestion = interviewSession.currentIndex === interviewSession.questions.length - 1;

        interviewNextBtn.textContent = isLastQuestion ? "Generate Final Report" : "Next Question";
        document.getElementById("interviewNextCard").hidden = false;

        submitAnswerBtn.hidden = true;

    });

}

if (interviewNextBtn) {

    interviewNextBtn.addEventListener("click", () => {

        if (!interviewSession) return;

        const isLastQuestion = interviewSession.currentIndex === interviewSession.questions.length - 1;

        if (isLastQuestion) {

            generateFinalReport();

        } else {

            interviewSession.currentIndex++;
            showQuestion();

        }

    });

}


// ---------- Final report ----------

let currentInterviewReport = null;

function generateFinalReport() {

    const responses = interviewSession.responses;

    const avg = (key) => Math.round(responses.reduce((sum, r) => sum + r[key], 0) / responses.length);

    const avgTechnical = avg("technical");
    const avgCommunication = avg("communication");
    const avgConfidence = avg("confidence");
    const avgOverall = avg("overall");

    const allStrengths = [...new Set(responses.flatMap(r => r.strengths))];
    const allWeaknesses = [...new Set(responses.flatMap(r => r.weaknesses))];
    const allSuggestions = [...new Set(responses.map(r => r.suggestion))];

    currentInterviewReport = {
        role: interviewSession.role,
        difficulty: interviewSession.difficulty,
        avgTechnical, avgCommunication, avgConfidence, avgOverall,
        strengths: allStrengths,
        weaknesses: allWeaknesses,
        suggestions: allSuggestions,
        questionCount: responses.length,
        savedAt: null
    };

    document.getElementById("finalReportSummary").textContent =
        `You completed a ${interviewSession.difficulty} mock interview for ${interviewSession.role} across ${responses.length} questions, ` +
        `averaging ${avgOverall}% overall (Technical ${avgTechnical}%, Communication ${avgCommunication}%, Confidence ${avgConfidence}%).`;

    renderList("finalStrengthsList", allStrengths);
    renderList("finalWeaknessesList", allWeaknesses);
    renderList("finalSuggestionsList", allSuggestions);

    if (typeof Chart !== "undefined") {

        const canvas = document.getElementById("finalReportChart");

        if (canvas) {

            if (canvas._chartInstance) canvas._chartInstance.destroy();

            canvas._chartInstance = new Chart(canvas, {

                type: "bar",
                data: {
                    labels: ["Technical", "Communication", "Confidence"],
                    datasets: [{
                        data: [avgTechnical, avgCommunication, avgConfidence],
                        backgroundColor: ["#ff4fd8", "#8A2BE2", "#5B6CFF"],
                        borderRadius: 8,
                        maxBarThickness: 60
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 0, max: 100, grid: { color: "rgba(255,255,255,.08)" }, ticks: { callback: (v) => v + "%" } },
                        x: { grid: { display: false } }
                    }
                }

            });

        }

    }

    document.getElementById("interviewNextCard").hidden = true;
    document.getElementById("finalReportCard").hidden = false;
    document.getElementById("finalReportCard").scrollIntoView({ behavior: "smooth", block: "start" });

    showDashboardToast("Interview complete — final report ready.", "success");
    window.logActivity?.(`Mock interview completed for ${interviewSession.role} — scored ${avgOverall}%.`, "fa-microphone");

}


// ---------- Save & History ----------

const INTERVIEW_HISTORY_KEY = "ai_helpdesk_interview_history";

function getInterviewHistory() {

    try {

        return JSON.parse(localStorage.getItem(INTERVIEW_HISTORY_KEY) || "[]");

    } catch (err) {

        return [];

    }

}

function renderInterviewHistory() {

    const historyEl = document.getElementById("interviewHistory");
    if (!historyEl) return;

    const history = getInterviewHistory();

    if (history.length === 0) {

        historyEl.innerHTML =
            `<div class="history-item"><h3>No Interviews Yet</h3><p>Your completed mock interviews will appear here.</p></div>`;
        return;

    }

    historyEl.innerHTML = history.map((h, i) =>
        `<div class="history-item">
            <h3>${h.role} — ${h.difficulty}</h3>
            <p>${h.avgOverall}% overall · ${h.questionCount} questions · ${new Date(h.savedAt).toLocaleDateString()}</p>
            <button type="button" class="link-btn" data-interview-history-index="${i}">View Full Report</button>
        </div>`
    ).join("");

}

if (saveInterviewReportBtn) {

    saveInterviewReportBtn.addEventListener("click", () => {

        if (!currentInterviewReport) {

            showDashboardToast("Complete an interview first.", "error");
            return;

        }

        const history = getInterviewHistory();

        history.unshift({ ...currentInterviewReport, savedAt: new Date().toISOString() });
        localStorage.setItem(INTERVIEW_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));

        renderInterviewHistory();
        showDashboardToast("Interview report saved to your history.", "success");

    });

}

const interviewHistoryEl = document.getElementById("interviewHistory");

if (interviewHistoryEl) {

    interviewHistoryEl.addEventListener("click", (e) => {

        const btn = e.target.closest("[data-interview-history-index]");
        if (!btn) return;

        const history = getInterviewHistory();
        const saved = history[parseInt(btn.dataset.interviewHistoryIndex, 10)];

        if (!saved) return;

        document.getElementById("finalReportSummary").textContent =
            `${saved.role} — ${saved.difficulty} mock interview across ${saved.questionCount} questions, ` +
            `averaging ${saved.avgOverall}% overall (Technical ${saved.avgTechnical}%, Communication ${saved.avgCommunication}%, Confidence ${saved.avgConfidence}%).`;

        renderList("finalStrengthsList", saved.strengths);
        renderList("finalWeaknessesList", saved.weaknesses);
        renderList("finalSuggestionsList", saved.suggestions);

        currentInterviewReport = saved;

        document.getElementById("finalReportCard").hidden = false;
        document.getElementById("finalReportCard").scrollIntoView({ behavior: "smooth", block: "start" });

    });

}

renderInterviewHistory();
/* ======================================================
   AI MENTOR
====================================================== */

const MENTOR_HISTORY_KEY = "ai_helpdesk_mentor_history";
const MENTOR_TARGET_ROLE = "AI/ML Engineer";

const generateMentorReportBtn = document.getElementById("generateMentorReport");
const saveMentorReportBtn = document.getElementById("saveMentorReport");
const mentorReport = document.getElementById("mentorReport");
const mentorReportUpdatedTag = document.getElementById("mentorReportUpdatedTag");
const askMentorBtn = document.getElementById("askMentorBtn");
const mentorQuestionInput = document.getElementById("mentorQuestionInput");
const mentorAnswerCard = document.getElementById("mentorAnswerCard");
const mentorAnswerText = document.getElementById("mentorAnswerText");
const mentorSuggestedQuestions = document.getElementById("mentorSuggestedQuestions");
const mentorHistoryEl = document.getElementById("mentorHistory");

let currentMentorReport = null;

// ---------- Gather live data from every other agent ----------

function getMentorInputs() {

    const interviewHistory = getInterviewHistory();
    const projectHistory = getProjectHistory();
    const internshipHistory = getInternshipHistory();

    const resumeScore = lastAnalysis ? lastAnalysis.score : null;
    const skillScore = lastSkillGapAnalysis ? lastSkillGapAnalysis.score : null;

    const interviewAvg = interviewHistory.length
        ? Math.round(interviewHistory.reduce((sum, h) => sum + h.avgOverall, 0) / interviewHistory.length)
        : null;

    const internshipTopScore = internshipHistory.length
        ? internshipHistory[0].results[0].score
        : null;

    // Career health = weighted average of every score we actually have, so the
    // circle only reflects agents the user has actually engaged with.
    const scores = [resumeScore, skillScore, interviewAvg, internshipTopScore].filter(v => typeof v === "number");
    const projectSignal = Math.min(100, projectHistory.length * 25);
    if (projectHistory.length) scores.push(projectSignal);

    const careerHealth = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    return {
        resumeScore, skillScore, interviewAvg, internshipTopScore,
        projectCount: projectHistory.length,
        internshipCount: internshipHistory.length,
        interviewCount: interviewHistory.length,
        careerHealth,
        currentSkills: currentSkillsArr,
        role: (lastSkillGapAnalysis && lastSkillGapAnalysis.role) || (lastAnalysis && lastAnalysis.role) || MENTOR_TARGET_ROLE,
        matchedSkills: lastSkillGapAnalysis ? lastSkillGapAnalysis.matched : [],
        missingSkills: lastSkillGapAnalysis ? lastSkillGapAnalysis.missing : [],
        resumeStrengths: lastAnalysis ? lastAnalysis.strengths : [],
        resumeWeaknesses: lastAnalysis ? lastAnalysis.weaknesses : [],
        latestInterview: interviewHistory[0] || null,
        latestProject: projectHistory[0] || null
    };

}

// ---------- Career Snapshot ----------

function renderMentorSnapshot() {

    const data = getMentorInputs();

    const scoreCircle = document.getElementById("mentorScoreCircle");
    const scoreValue = document.getElementById("mentorScoreValue");

    if (scoreCircle) {
        scoreCircle.style.setProperty("--score", data.careerHealth);
        scoreCircle.setAttribute("aria-label", `Overall career health: ${data.careerHealth} percent`);
    }
    if (scoreValue) scoreValue.textContent = `${data.careerHealth}%`;

    const resumeEl = document.getElementById("mentorResumeScore");
    if (resumeEl) resumeEl.textContent = data.resumeScore !== null ? `${data.resumeScore} / 100` : "Not analyzed yet";

    const skillEl = document.getElementById("mentorSkillScore");
    if (skillEl) skillEl.textContent = data.skillScore !== null ? `${data.skillScore}% ready` : "Not analyzed yet";

    const interviewEl = document.getElementById("mentorInterviewScore");
    if (interviewEl) interviewEl.textContent = data.interviewAvg !== null
        ? `${data.interviewAvg}% avg · ${data.interviewCount} session${data.interviewCount === 1 ? "" : "s"}`
        : "No interviews yet";

    const projectEl = document.getElementById("mentorProjectCount");
    if (projectEl) projectEl.textContent = `${data.projectCount} completed`;

    const internshipEl = document.getElementById("mentorInternshipCount");
    if (internshipEl) internshipEl.textContent = data.internshipCount
        ? `${data.internshipCount} saved · top ${data.internshipTopScore}%`
        : "Not generated yet";

    const roleTag = document.getElementById("mentorTargetRoleTag");
    if (roleTag) roleTag.textContent = `Target: ${data.role}`;

    return data;

}

// ---------- Career Growth Radar ----------

function renderMentorRadar(data) {

    if (typeof Chart === "undefined") return;

    const canvas = document.getElementById("mentorRadarChart");
    if (!canvas) return;

    const values = [
        data.resumeScore ?? 0,
        data.skillScore ?? 0,
        data.interviewAvg ?? 0,
        Math.min(100, data.projectCount * 25),
        data.internshipTopScore ?? 0
    ];

    if (canvas._chartInstance) canvas._chartInstance.destroy();

    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    canvas._chartInstance = new Chart(canvas, {

        type: "radar",
        data: {
            labels: ["Resume", "Skills", "Interview", "Projects", "Internships"],
            datasets: [{
                label: "Readiness",
                data: values,
                backgroundColor: "rgba(255,79,216,.15)",
                borderColor: "#ff4fd8",
                pointBackgroundColor: "#ffffff",
                pointBorderColor: "#8A2BE2",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: reducedMotion ? false : { duration: 900 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgba(10,20,45,.95)",
                    borderColor: "rgba(255,255,255,.15)",
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    grid: { color: "rgba(255,255,255,.1)" },
                    angleLines: { color: "rgba(255,255,255,.1)" },
                    pointLabels: { color: "#d8d8d8", font: { size: 11 } },
                    ticks: { display: false, backdropColor: "transparent" }
                }
            }
        }

    });

}

// ---------- Strengths & Improvements ----------

function renderMentorInsights(data) {

    const strengthsEl = document.getElementById("mentorStrengthsList");
    const improvementsEl = document.getElementById("mentorImprovementsList");
    if (!strengthsEl || !improvementsEl) return;

    const strengths = [];
    const improvements = [];

    if (data.resumeScore !== null) {
        if (data.resumeScore >= 75) strengths.push(`Strong resume — scoring ${data.resumeScore}/100 for ${data.role}.`);
        else improvements.push(`Revisit your resume — it's currently scoring ${data.resumeScore}/100.`);
        data.resumeStrengths.slice(0, 2).forEach(s => strengths.push(`Resume strength: ${s}`));
        data.resumeWeaknesses.slice(0, 2).forEach(w => improvements.push(`Resume gap: ${w}`));
    }

    if (data.skillScore !== null) {
        if (data.skillScore >= 70) strengths.push(`${data.skillScore}% skill match for ${data.role} — solid technical footing.`);
        else improvements.push(`Skill readiness is at ${data.skillScore}% for ${data.role} — close the gap in the Skill Gap agent.`);
        if (data.missingSkills.length) improvements.push(`Missing skills: ${data.missingSkills.slice(0, 3).join(", ")}.`);
    }

    if (data.interviewAvg !== null) {
        if (data.interviewAvg >= 75) strengths.push(`Averaging ${data.interviewAvg}% across ${data.interviewCount} mock interview${data.interviewCount === 1 ? "" : "s"}.`);
        else improvements.push(`Mock interview average is ${data.interviewAvg}% — keep practicing to build confidence.`);
    } else {
        improvements.push("Take a mock interview to get real interview feedback here.");
    }

    if (data.projectCount > 0) strengths.push(`${data.projectCount} project blueprint${data.projectCount === 1 ? "" : "s"} saved — great portfolio momentum.`);
    else improvements.push("Generate and save a project blueprint to strengthen your portfolio.");

    if (data.currentSkills && data.currentSkills.length) strengths.push(`Active skill set: ${data.currentSkills.slice(0, 4).join(", ")}.`);

    strengthsEl.innerHTML = (strengths.length ? strengths : ["✔ Use the other AI agents so your mentor can find your strengths."])
        .slice(0, 6).map(s => `<li>✔ ${s}</li>`).join("");

    improvementsEl.innerHTML = (improvements.length ? improvements : ["• You're covering all the basics — keep up the consistent progress."])
        .slice(0, 6).map(s => `<li>• ${s}</li>`).join("");

}

// ---------- Master refresh ----------

function refreshMentorSnapshot() {

    const data = renderMentorSnapshot();
    renderMentorRadar(data);
    renderMentorInsights(data);
    return data;

}

window.refreshMentorSnapshot = refreshMentorSnapshot;

refreshMentorSnapshot();

// ---------- Generate full mentor report ----------

function buildMentorReportText(data) {

    const healthLabel = data.careerHealth >= 80 ? "Excellent" : data.careerHealth >= 60 ? "Good" : data.careerHealth >= 35 ? "Developing" : "Just Getting Started";

    const strengthsList = document.getElementById("mentorStrengthsList");
    const improvementsList = document.getElementById("mentorImprovementsList");

    const strengths = strengthsList ? Array.from(strengthsList.querySelectorAll("li")).map(li => li.textContent.replace(/^✔\s*/, "")) : [];
    const improvements = improvementsList ? Array.from(improvementsList.querySelectorAll("li")).map(li => li.textContent.replace(/^•\s*/, "")) : [];

    return `Career Health Score : ${data.careerHealth}/100 (${healthLabel})
Target Role : ${data.role}

Strengths
${strengths.map(s => `• ${s}`).join("\n")}

Areas for Improvement
${improvements.map(s => `• ${s}`).join("\n")}

Personalized Recommendations
${data.resumeScore === null ? "• Run the Resume Analyzer to get a baseline score.\n" : ""}${data.skillScore === null ? "• Run the Skill Gap agent to see how you match your target role.\n" : ""}${data.interviewAvg === null ? "• Take a mock interview to build interview confidence.\n" : ""}${data.projectCount === 0 ? "• Generate and save a project blueprint for your portfolio.\n" : ""}• Keep using every agent regularly — this report gets sharper with more data.

Overall Career Analysis
You're at a "${healthLabel}" stage toward becoming a ${data.role}. Focus on the improvement areas above, keep building your project portfolio, and revisit this report after each new resume, interview, or project to track your progress.`;

}

if (generateMentorReportBtn) {

    generateMentorReportBtn.addEventListener("click", () => {

        generateMentorReportBtn.disabled = true;
        generateMentorReportBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...';

        // ===============================
        // BACKEND INTEGRATION — NOT WIRED (data-model mismatch)
        // ===============================
        // A real GET /mentor/ endpoint does exist in backend/app, but it
        // reads from MongoDB documents saved via POST /memory/ and POST
        // /career-progress/ (mentor_service.py requires both to already
        // exist for this user) and returns a Gemini-generated narrative —
        // a different shape and data source than this panel's local,
        // client-side composite score (built from localStorage histories
        // across Interview/Project/Internship). Wiring it properly means
        // first saving a matching career_progress document, which isn't
        // collected anywhere in this UI yet. Left as local computation
        // until that's designed; Save Memory (above) is wired to the real
        // POST /memory/ endpoint already.
        //
        // fetch(API_BASE + "/mentor/", {
        //     method: "GET",
        //     headers: { "Authorization": `Bearer ${token}` }
        // })
        // .then(res => res.json())
        // .then(data => { mentorReport.value = data.report; })
        // .catch(() => showDashboardToast("Mentor report failed. Please try again.", "error"))
        // .finally(() => { generateMentorReportBtn.disabled = false; ... });

        setTimeout(() => {

            const data = refreshMentorSnapshot();
            const reportText = buildMentorReportText(data);

            mentorReport.value = reportText;

            currentMentorReport = {
                role: data.role,
                careerHealth: data.careerHealth,
                report: reportText
            };

            generateMentorReportBtn.disabled = false;
            generateMentorReportBtn.innerHTML =
                '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Report Generated';

            if (mentorReportUpdatedTag) {
                mentorReportUpdatedTag.hidden = false;
                mentorReportUpdatedTag.textContent = "Updated just now";
            }

            showDashboardToast("AI Mentor report generated.", "success");
            window.logActivity?.(`AI Mentor report generated — career health ${data.careerHealth}%.`, "fa-user-tie");

        }, 1600);

    });

}

// ---------- Ask Your Mentor ----------

function answerMentorQuestion(question, data) {

    const q = question.toLowerCase();

    if (q.includes("interview") || q.includes("ready")) {
        return data.interviewAvg !== null
            ? `You're averaging ${data.interviewAvg}% across ${data.interviewCount} mock interview${data.interviewCount === 1 ? "" : "s"}. ${data.interviewAvg >= 75 ? "You're in good shape — keep practicing to stay sharp." : "A couple more mock interviews should help build your confidence before the real thing."}`
            : "You haven't taken a mock interview yet — head to the Mock Interview agent to get a baseline score.";
    }

    if (q.includes("resume")) {
        return data.resumeScore !== null
            ? `Your resume is currently scoring ${data.resumeScore}/100 for ${data.role}. ${data.resumeWeaknesses.length ? `Biggest gap right now: ${data.resumeWeaknesses[0]}.` : "Keep it updated as you gain new skills and projects."}`
            : "You haven't analyzed a resume yet — upload one in the Resume Analyzer to get a score and feedback.";
    }

    if (q.includes("project")) {
        return data.projectCount > 0
            ? `You have ${data.projectCount} saved project blueprint${data.projectCount === 1 ? "" : "s"}. Building one more polished, end-to-end project in your target domain will meaningfully strengthen your portfolio.`
            : "You haven't saved a project yet — try the Project Architect agent to generate a blueprint matched to your goals.";
    }

    if (q.includes("skill")) {
        return data.skillScore !== null
            ? `Your skill readiness for ${data.role} is ${data.skillScore}%. ${data.missingSkills.length ? `Focus next on: ${data.missingSkills.slice(0, 3).join(", ")}.` : "You're covering the key skills well."}`
            : "Run the Skill Gap agent with your current skills to see exactly what's missing for your target role.";
    }

    // Default: "what should I focus on next" and anything else
    if (data.resumeScore === null) return "Start with the Resume Analyzer — it's the fastest way to give your mentor a baseline to work from.";
    if (data.skillScore === null) return "Run the Skill Gap agent next to see how your current skills match your target role.";
    if (data.interviewAvg === null) return "Take a mock interview to build confidence and get real feedback on your answers.";
    if (data.projectCount === 0) return "Generate a project blueprint in Project Architect — a strong portfolio project is your next best move.";
    return `You're covering all the basics well (career health ${data.careerHealth}%). Focus on deepening your ${data.missingSkills[0] || "weakest"} skills and keep practicing interviews to push toward your ${data.role} goal.`;

}

if (askMentorBtn) {

    askMentorBtn.addEventListener("click", () => {

        const question = mentorQuestionInput.value.trim();

        if (!question) {
            showDashboardToast("Type a question or tap a suggestion first.", "error");
            return;
        }

        const data = getMentorInputs();
        const answer = answerMentorQuestion(question, data);

        mentorAnswerText.textContent = answer;
        mentorAnswerCard.hidden = false;
        mentorAnswerCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

    });

}

if (mentorSuggestedQuestions) {

    mentorSuggestedQuestions.addEventListener("click", (e) => {

        const chip = e.target.closest("[data-mentor-question]");
        if (!chip) return;

        mentorQuestionInput.value = chip.getAttribute("data-mentor-question");
        askMentorBtn.click();

    });

}

// ---------- Mentor Report History ----------

function getMentorHistory() {

    try {
        return JSON.parse(localStorage.getItem(MENTOR_HISTORY_KEY) || "[]");
    } catch (err) {
        return [];
    }

}

function renderMentorHistory() {

    if (!mentorHistoryEl) return;

    const history = getMentorHistory();

    if (history.length === 0) {
        mentorHistoryEl.innerHTML =
            `<div class="history-item"><h3>No Reports Yet</h3><p>Your saved AI mentor reports will appear here.</p></div>`;
        return;
    }

    mentorHistoryEl.innerHTML = history.map((h, i) =>
        `<div class="history-item">
            <h3>${h.role} — Career Health ${h.careerHealth}%</h3>
            <p>${new Date(h.savedAt).toLocaleDateString()}</p>
            <button type="button" class="link-btn" data-mentor-history-index="${i}">View Full Report</button>
        </div>`
    ).join("");

}

if (saveMentorReportBtn) {

    saveMentorReportBtn.addEventListener("click", () => {

        if (!currentMentorReport) {
            showDashboardToast("Generate a mentor report first.", "error");
            return;
        }

        const history = getMentorHistory();
        history.unshift({ ...currentMentorReport, savedAt: new Date().toISOString() });
        localStorage.setItem(MENTOR_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));

        renderMentorHistory();
        showDashboardToast("Mentor report saved to your history.", "success");
        window.logActivity?.(`AI Mentor report saved — career health ${currentMentorReport.careerHealth}%.`, "fa-user-tie");

    });

}

if (mentorHistoryEl) {

    mentorHistoryEl.addEventListener("click", (e) => {

        const btn = e.target.closest("[data-mentor-history-index]");
        if (!btn) return;

        const history = getMentorHistory();
        const item = history[Number(btn.dataset.mentorHistoryIndex)];
        if (!item) return;

        mentorReport.value = item.report;
        currentMentorReport = item;

        if (mentorReportUpdatedTag) {
            mentorReportUpdatedTag.hidden = false;
            mentorReportUpdatedTag.textContent = `Saved ${new Date(item.savedAt).toLocaleDateString()}`;
        }

        mentorReport.scrollIntoView({ behavior: "smooth", block: "center" });

    });

}

renderMentorHistory();
/* ======================================================
   LANGGRAPH ORCHESTRATOR
====================================================== */

const generateCareerReportBtn = document.getElementById("generateCareerReport");
const downloadCareerReportBtn = document.getElementById("downloadCareerReport");
const unifiedReportOutput = document.getElementById("unifiedReportOutput");

let currentUnifiedReport = null;

// ---------- Live status for every agent in the pipeline ----------

function computeWorkflowStatus() {

    const interviewHistory = getInterviewHistory();
    const projectHistory = getProjectHistory();
    const internshipHistory = getInternshipHistory();
    const mentorHistory = getMentorHistory();

    const interviewAvg = interviewHistory.length
        ? Math.round(interviewHistory.reduce((sum, h) => sum + h.avgOverall, 0) / interviewHistory.length)
        : null;

    const memorySaved = localStorage.getItem("ai_helpdesk_memory_saved") === "true";

    const mentorReportEl = document.getElementById("mentorReport");
    const mentorGenerated = mentorHistory.length > 0 || Boolean(mentorReportEl && mentorReportEl.value.trim());

    return {

        resume: {
            completed: Boolean(lastAnalysis),
            detail: lastAnalysis ? `${lastAnalysis.role} — ${lastAnalysis.score}/100` : "Analyze a resume to begin."
        },
        skill: {
            completed: Boolean(lastSkillGapAnalysis),
            detail: lastSkillGapAnalysis ? `${lastSkillGapAnalysis.role} — ${lastSkillGapAnalysis.score}% ready` : "Run a skill gap analysis."
        },
        learning: {
            completed: Boolean(lastLearningPlan),
            detail: lastLearningPlan ? `${lastLearningPlan.role} — ${lastLearningPlan.totalWeeks}-week roadmap` : "Generate a learning roadmap."
        },
        projects: {
            completed: projectHistory.length > 0,
            detail: projectHistory.length ? `${projectHistory.length} blueprint${projectHistory.length === 1 ? "" : "s"} saved` : "Save a project blueprint."
        },
        interview: {
            completed: interviewHistory.length > 0,
            detail: interviewHistory.length ? `${interviewHistory.length} session${interviewHistory.length === 1 ? "" : "s"} · avg ${interviewAvg}%` : "Complete a mock interview."
        },
        memory: {
            completed: memorySaved,
            detail: memorySaved ? "Career profile stored" : "Save your career memory."
        },
        mentor: {
            completed: mentorGenerated,
            detail: mentorGenerated ? "Mentor report available" : "Generate an AI mentor report."
        },
        internshipCount: internshipHistory.length

    };

}

// ---------- Render pipeline + status grid + progress ----------

function renderWorkflowStatus(status) {

    const agents = ["resume", "skill", "learning", "projects", "interview", "memory", "mentor"];
    const completedCount = agents.filter(a => status[a].completed).length;

    document.querySelectorAll("#workflow .flow-box[data-agent]").forEach(box => {

        const agent = box.getAttribute("data-agent");
        const info = status[agent];
        const label = box.querySelector("[data-flow-status]");

        box.classList.toggle("completed", info.completed);
        if (label) label.textContent = info.completed ? "Completed" : "Waiting";

    });

    document.querySelectorAll("#workflowStatusGrid .candidate-box[data-agent]").forEach(box => {

        const agent = box.getAttribute("data-agent");
        const info = status[agent];
        const badge = box.querySelector("[data-status-badge]");
        const detail = box.querySelector("[data-status-detail]");

        if (badge) {
            badge.textContent = info.completed ? "Completed" : "Waiting";
            badge.classList.toggle("success", info.completed);
            badge.classList.toggle("pending", !info.completed);
        }

        if (detail) detail.textContent = info.detail;

    });

    const pipelineTag = document.getElementById("workflowPipelineTag");
    if (pipelineTag) pipelineTag.textContent = `${completedCount} / ${agents.length} complete`;

    const readiness = Math.round((completedCount / agents.length) * 100);

    const progressFill = document.getElementById("workflowProgressFill");
    if (progressFill) {
        progressFill.style.width = `${readiness}%`;
        progressFill.closest(".progress")?.setAttribute("aria-valuenow", readiness);
    }

    const readinessValue = document.getElementById("workflowReadinessValue");
    if (readinessValue) readinessValue.textContent = `${readiness}%`;

    return { completedCount, readiness };

}

function refreshWorkflowStatus() {

    const status = computeWorkflowStatus();
    renderWorkflowStatus(status);
    return status;

}

window.refreshWorkflowStatus = refreshWorkflowStatus;

refreshWorkflowStatus();

// ---------- Build the combined report text ----------

function buildUnifiedReportText(status, readiness) {

    const sections = [];

    sections.push(`UNIFIED AI CAREER REPORT`);
    sections.push(`Generated ${new Date().toLocaleString()}`);
    sections.push(`Overall Career Readiness: ${readiness}%\n`);

    sections.push(`RESUME ANALYSIS`);
    sections.push(status.resume.completed
        ? `${status.resume.detail}. Strengths: ${(lastAnalysis.strengths || []).slice(0, 3).join(", ") || "n/a"}.`
        : "Not completed yet — run the Resume Analyzer.");

    sections.push(`\nSKILL GAP ANALYSIS`);
    sections.push(status.skill.completed
        ? `${status.skill.detail}. Missing skills: ${(lastSkillGapAnalysis.missing || []).slice(0, 4).join(", ") || "none"}.`
        : "Not completed yet — run the Skill Gap agent.");

    sections.push(`\nLEARNING ROADMAP`);
    sections.push(status.learning.completed
        ? `${status.learning.detail}. Focus first on: ${(lastLearningPlan.high || []).slice(0, 2).join(", ") || "your top priority skills"}.`
        : "Not completed yet — generate a roadmap in the Learning Planner.");

    sections.push(`\nPROJECT PORTFOLIO`);
    const projectHistory = getProjectHistory();
    sections.push(status.projects.completed
        ? `${status.projects.detail}. Most recent: ${projectHistory[0].title}.`
        : "Not completed yet — generate and save a project in Project Architect.");

    sections.push(`\nINTERVIEW PERFORMANCE`);
    sections.push(status.interview.completed
        ? status.interview.detail
        : "Not completed yet — take a mock interview.");

    sections.push(`\nMEMORY`);
    sections.push(status.memory.completed
        ? "Career profile has been stored and is available to every agent."
        : "Not completed yet — save your career memory.");

    sections.push(`\nAI MENTOR`);
    sections.push(status.mentor.completed
        ? "A personalized mentor report is available on the AI Mentor page."
        : "Not completed yet — generate an AI Mentor report.");

    if (status.internshipCount > 0) {
        sections.push(`\nINTERNSHIP MATCHES`);
        sections.push(`${status.internshipCount} recommendation set${status.internshipCount === 1 ? "" : "s"} saved.`);
    }

    sections.push(`\nSUMMARY`);
    sections.push(readiness >= 80
        ? "You've engaged with almost every agent — you're in strong shape. Keep your resume and mentor report current as you progress."
        : readiness >= 40
            ? "You're making solid progress. Complete the remaining agents above for a fuller picture and a stronger unified report."
            : "You're just getting started. Work through each agent in the pipeline above to build a complete career profile.");

    return sections.join("\n");

}

// ---------- Generate ----------

if (generateCareerReportBtn) {

    generateCareerReportBtn.addEventListener("click", () => {

        generateCareerReportBtn.disabled = true;
        generateCareerReportBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...';

        // ===============================
        // BACKEND INTEGRATION — NOT WIRED (aggregation, not one agent)
        // ===============================
        // This panel aggregates results already produced by the other
        // (now-live) agent panels on this page, so there's no single
        // matching backend endpoint to swap in. The closest real
        // equivalent is POST /orchestrator/, which runs resume ->
        // skill-gap -> learning-plan -> mentor -> internship/project as
        // one server-side pipeline from a single resume_text + target_role
        // input — a genuinely different flow (one big call, not a
        // client-side rollup of separately-run agents). Left as local
        // aggregation; worth a follow-up if you want this page to call
        // /orchestrator/ directly.
        //
        // fetch("/api/career-report", {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(computeWorkflowStatus())
        // })
        // .then(res => res.json())
        // .then(data => { unifiedReportOutput.value = data.report; })
        // .catch(() => showDashboardToast("Couldn't generate the unified report. Please try again.", "error"))
        // .finally(() => { generateCareerReportBtn.disabled = false; ... });

        setTimeout(() => {

            const status = refreshWorkflowStatus();
            const { readiness } = renderWorkflowStatus(status);
            const reportText = buildUnifiedReportText(status, readiness);

            unifiedReportOutput.value = reportText;
            currentUnifiedReport = reportText;

            generateCareerReportBtn.disabled = false;
            generateCareerReportBtn.innerHTML =
                '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Report Generated';

            showDashboardToast("Unified AI Career Report generated.", "success");
            window.logActivity?.(`Unified career report generated — ${readiness}% overall readiness.`, "fa-diagram-project");

        }, 1800);

    });

}

// ---------- Download ----------

if (downloadCareerReportBtn) {

    downloadCareerReportBtn.addEventListener("click", () => {

        let reportText = currentUnifiedReport;

        if (!reportText) {

            const status = refreshWorkflowStatus();
            const readiness = Math.round(
                (["resume", "skill", "learning", "projects", "interview", "memory", "mentor"]
                    .filter(a => status[a].completed).length / 7) * 100
            );
            reportText = buildUnifiedReportText(status, readiness);
            unifiedReportOutput.value = reportText;
            currentUnifiedReport = reportText;

        }

        const blob = new Blob([reportText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "ai-career-report.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showDashboardToast("Career report downloaded.", "success");
        window.logActivity?.("Unified career report downloaded.", "fa-download");

    });

}
/* ======================================================
   MEMORY AGENT
====================================================== */

const saveMemoryBtn = document.getElementById("saveMemory");
const retrieveMemoryBtn = document.getElementById("retrieveMemory");
const memoryProfile = document.getElementById("memoryProfile");

// Save Career Memory

if (saveMemoryBtn) {

    saveMemoryBtn.addEventListener("click", () => {

        saveMemoryBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        // ===============================
        // BACKEND INTEGRATION
        // ===============================
        // Real endpoint: POST /memory/ (requires auth). Body must match
        // MemoryCreate: { skills, goals, projects, resume_score }.
        // Pulls together whatever the user has produced across agents so far.

        const careerGoalEl = document.getElementById("careerGoal");
        const goalValue = (careerGoalEl && careerGoalEl.value.trim())
            || (lastSkillGapAnalysis && lastSkillGapAnalysis.role)
            || "Not set";

        const projectTitles = getProjectHistory().map(p => p.title).filter(Boolean);

        const body = {
            skills: currentSkillsArr,
            goals: [goalValue],
            projects: projectTitles.length ? projectTitles : ["No projects saved yet"],
            resume_score: (lastAnalysis && typeof lastAnalysis.score === "number") ? lastAnalysis.score : 0
        };

        apiFetch("/memory/", { method: "POST", body, auth: true })
            .then(() => {

                saveMemoryBtn.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> Memory Saved';

                // Lets the LangGraph Orchestrator detect that this agent has been used.
                localStorage.setItem("ai_helpdesk_memory_saved", "true");

                showDashboardToast("Career profile saved successfully!", "success");
                window.logActivity?.("Career memory saved.", "fa-brain");

            })
            .catch((err) => {

                console.error(err);
                saveMemoryBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Memory';
                showDashboardToast(err.message, "error");

            });

    });

}

// Retrieve Career Memory

if (retrieveMemoryBtn) {

    retrieveMemoryBtn.addEventListener("click", () => {

        retrieveMemoryBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Retrieving...';

        // ===============================
        // BACKEND INTEGRATION
        // ===============================
        // Real endpoint: GET /memory/ (requires auth). Returns the
        // MemoryCreate document last saved for this user, or 404 if
        // nothing has been saved yet.

        apiFetch("/memory/", { auth: true })
            .then((data) => {

                memoryProfile.value =
`Saved Career Profile

Skills
${(data.skills || []).map(s => `• ${s}`).join("\n") || "• (none saved)"}

Career Goal
${(data.goals || []).map(g => `• ${g}`).join("\n") || "• (none saved)"}

Projects
${(data.projects || []).map(p => `• ${p}`).join("\n") || "• (none saved)"}

Resume Score
• ${data.resume_score ?? 0} / 100

Status
Your career profile has been successfully stored and is now available for all AI agents including Resume Analyzer, Skill Gap Agent, Learning Planner, Interview Coach, Project Architect, Internship Recommendation, and AI Mentor.`;

                retrieveMemoryBtn.innerHTML =
                '<i class="fa-solid fa-circle-check"></i> Memory Retrieved';

            })
            .catch((err) => {

                if (err.status === 404) {
                    memoryProfile.value = "No saved career profile yet. Click \"Save Memory\" first.";
                    retrieveMemoryBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i> Retrieve Memory';
                    return;
                }

                console.error(err);
                retrieveMemoryBtn.innerHTML = '<i class="fa-solid fa-database"></i> Retrieve Memory';
                showDashboardToast(err.message, "error");

            });

    });

}
/* ======================================================
   PROJECT ARCHITECT AGENT
====================================================== */

// Shared boilerplate that's genuinely the same across domains —
// standard repo hygiene doesn't need to be reinvented per template.

const standardRepoStructure =
`├── .github/workflows/ci.yml
├── client/ (or frontend/)
├── server/ (or backend/)
├── docs/
├── .gitignore
├── README.md
└── LICENSE

main branch protected, feature branches merged via pull request,
semantic commit messages (feat:, fix:, docs:, etc.).`;

const durationByExperience = {
    "Beginner": "3–4 weeks",
    "Intermediate": "5–7 weeks",
    "Advanced": "8–10 weeks"
};

// ---------- Per-domain project blueprint templates ----------
// Each domain shares one realistic architecture (stack, DB design,
// folder structure, API, deployment, roadmap); the 3 project ideas
// within a domain differ in title/problem/description/features,
// which is where the real creative variation belongs. Experience
// level scales complexity on top of this (see buildProjectBlueprint).

const domainProjectTemplates = {

    "Web Development": {

        ideas: [
            {
                title: "Freelancer Marketplace Platform",
                problem: "Freelancers struggle to find trustworthy clients and manage payments and contracts across scattered platforms.",
                description: "A marketplace connecting freelancers with clients, featuring project bidding, secure escrow payments, and reviews.",
                features: ["User & freelancer profiles with portfolios", "Project bidding and proposal system", "Escrow-based payment release", "In-app messaging", "Ratings & reviews"]
            },
            {
                title: "Real-Time Collaborative Whiteboard",
                problem: "Remote teams lack a lightweight, real-time space to sketch ideas together.",
                description: "A browser-based whiteboard supporting multiple users drawing and editing simultaneously with live cursors.",
                features: ["Real-time multi-user drawing via WebSockets", "Shape & text tools", "Session rooms with shareable links", "Undo/redo history", "Export board as image"]
            },
            {
                title: "Personal Finance Tracker",
                problem: "Many people struggle to track spending across multiple accounts and set realistic budgets.",
                description: "A web app that aggregates transactions, categorizes spending, and visualizes budget progress.",
                features: ["Manual & CSV transaction import", "Auto-categorization of expenses", "Monthly budget goals with alerts", "Spending trend charts", "Multi-account support"]
            }
        ],

        stack: { frontend: ["React", "Tailwind CSS"], backend: ["Node.js", "Express"], database: ["PostgreSQL"] },
        advancedStack: { frontend: ["Redux Toolkit"], backend: ["Redis (caching)", "Socket.io"], database: ["Read replicas"] },

        dbTables: [
            { name: "users", columns: ["id", "name", "email", "password_hash", "role", "created_at"] },
            { name: "projects", columns: ["id", "user_id", "title", "status", "budget", "created_at"] },
            { name: "transactions", columns: ["id", "project_id", "amount", "status", "created_at"] }
        ],
        advancedDbTable: { name: "audit_logs", columns: ["id", "user_id", "action", "metadata", "created_at"] },

        apiEndpoints: [
            { method: "POST", path: "/api/auth/signup", desc: "Register a new user" },
            { method: "POST", path: "/api/auth/login", desc: "Authenticate a user" },
            { method: "GET", path: "/api/projects", desc: "List all projects" },
            { method: "POST", path: "/api/projects", desc: "Create a new project" }
        ],
        advancedApiEndpoints: [
            { method: "PUT", path: "/api/projects/:id", desc: "Update a project" },
            { method: "DELETE", path: "/api/projects/:id", desc: "Delete a project" }
        ],

        folderStructure:
`project-root/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── index.js
│   └── package.json
└── README.md`,

        deploymentSteps: ["Containerize frontend and backend with Docker", "Push images to a container registry", "Deploy backend to Render/Railway", "Deploy frontend to Vercel/Netlify", "Configure environment variables for API keys and DB URL", "Set up a managed PostgreSQL instance"],
        advancedDeploymentSteps: ["Add a CI/CD pipeline with GitHub Actions for automated tests & deploys", "Set up monitoring/alerts (e.g. UptimeRobot, Sentry)"],

        resumeValue: "Demonstrates full-stack ownership: authentication, relational data modeling, real-time or transactional features, and cloud deployment — a strong signal for full-stack or backend-leaning roles.",
        futureScope: ["Add a mobile app version with React Native", "Introduce AI-powered recommendations", "Add multi-language support", "Integrate third-party payment providers"],

        resources: [
            { title: "React", resource: "React Official Docs" },
            { title: "Node.js", resource: "Node.js Official Guides" },
            { title: "PostgreSQL", resource: "PostgreSQL Tutorial" },
            { title: "Docker", resource: "Docker Official Documentation" }
        ],

        roadmapWeeksBase: ["Design schema & set up project scaffolding", "Build core CRUD APIs & auth", "Build frontend UI & connect to APIs"],
        roadmapWeeksAdvanced: ["Add real-time features & caching", "Write tests, containerize, and deploy"]

    },

    "AI / Machine Learning": {

        ideas: [
            {
                title: "AI Resume Analyzer & Career Coach",
                problem: "Job seekers don't know how well their resume matches a target role or what to improve.",
                description: "An AI tool that scores resumes against job roles and gives actionable feedback using NLP.",
                features: ["PDF resume parsing", "ATS compatibility scoring", "Role-specific keyword gap analysis", "AI-generated improvement suggestions", "Downloadable report"]
            },
            {
                title: "Smart Medical Symptom Checker",
                problem: "People often misjudge the urgency of symptoms and delay or over-seek care.",
                description: "An ML-based assistant that takes symptoms and suggests likely conditions and urgency level, with clear disclaimers.",
                features: ["Symptom input via chat interface", "ML-based condition likelihood ranking", "Urgency triage (self-care / see doctor / emergency)", "Explainable AI reasoning", "Doctor/specialist suggestions"]
            },
            {
                title: "AI-Powered Content Moderation System",
                problem: "Online platforms struggle to moderate large volumes of user content for toxicity and spam.",
                description: "A moderation pipeline that classifies text/image content and flags policy violations in real time.",
                features: ["Text toxicity classification", "Image content flagging", "Human-in-the-loop review queue", "Configurable moderation rules", "Analytics dashboard"]
            }
        ],

        stack: { frontend: ["React", "Tailwind CSS"], backend: ["FastAPI", "Python"], database: ["MongoDB"] },
        advancedStack: { frontend: [], backend: ["Celery (async jobs)", "Redis"], database: ["Vector DB (Pinecone/FAISS)"] },

        dbTables: [
            { name: "users", columns: ["_id", "name", "email", "password_hash", "created_at"] },
            { name: "analyses", columns: ["_id", "user_id", "input_ref", "result", "score", "created_at"] },
            { name: "feedback_logs", columns: ["_id", "analysis_id", "comments", "created_at"] }
        ],
        advancedDbTable: { name: "model_versions", columns: ["_id", "model_name", "version", "metrics", "deployed_at"] },

        apiEndpoints: [
            { method: "POST", path: "/api/auth/login", desc: "Authenticate a user" },
            { method: "POST", path: "/api/analyze", desc: "Run AI analysis on submitted input" },
            { method: "GET", path: "/api/analyze/:id", desc: "Retrieve a past analysis result" },
            { method: "GET", path: "/api/history", desc: "List a user's analysis history" }
        ],
        advancedApiEndpoints: [
            { method: "POST", path: "/api/feedback", desc: "Submit feedback on an AI result" },
            { method: "DELETE", path: "/api/analyze/:id", desc: "Delete a saved analysis" }
        ],

        folderStructure:
`project-root/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.jsx
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
├── ml/
│   ├── notebooks/
│   └── training_scripts/
└── README.md`,

        deploymentSteps: ["Containerize the FastAPI service with Docker", "Store trained model artifacts in cloud storage (S3/GCS)", "Deploy backend to a GPU-capable host if needed, or Render for CPU-only inference", "Deploy frontend to Vercel", "Set environment variables for API keys and model paths", "Add request logging for model monitoring"],
        advancedDeploymentSteps: ["Set up a model registry & versioning workflow", "Add autoscaling for inference load spikes"],

        resumeValue: "Shows you can take an ML model from notebook to production: data pipeline, inference API, and a usable frontend — a strong signal for AI/ML engineering roles.",
        futureScope: ["Fine-tune a custom model on domain-specific data", "Add multi-language support", "Introduce active learning from user feedback", "Add explainability visualizations (SHAP/LIME)"],

        resources: [
            { title: "FastAPI", resource: "FastAPI Official Documentation" },
            { title: "scikit-learn", resource: "scikit-learn User Guide" },
            { title: "MongoDB", resource: "MongoDB Official Documentation" },
            { title: "Hugging Face", resource: "Hugging Face Course" }
        ],

        roadmapWeeksBase: ["Collect/prepare dataset & explore a baseline model", "Build an inference API around the model", "Build the frontend to submit input & view results"],
        roadmapWeeksAdvanced: ["Add async job processing & caching for heavy requests", "Add model monitoring, then containerize and deploy"]

    },

    "Data Science": {

        ideas: [
            {
                title: "Customer Churn Prediction Dashboard",
                problem: "Subscription businesses lose revenue by not identifying at-risk customers early.",
                description: "A dashboard that predicts churn probability per customer and highlights key churn drivers.",
                features: ["Churn probability scoring per customer", "Feature importance visualization", "Cohort & segment filtering", "Exportable at-risk customer lists", "Model retraining trigger"]
            },
            {
                title: "Sales Forecasting Engine",
                problem: "Businesses struggle to plan inventory and staffing without reliable demand forecasts.",
                description: "A forecasting tool that predicts future sales using historical data and seasonal trends.",
                features: ["Time-series forecasting per product/region", "Seasonality & trend decomposition", "Interactive forecast charts", "Confidence interval display", "CSV data upload"]
            },
            {
                title: "Sentiment Analysis for Product Reviews",
                problem: "Companies have thousands of reviews but no fast way to extract sentiment trends.",
                description: "A pipeline that classifies review sentiment and surfaces recurring themes and complaints.",
                features: ["Sentiment classification (positive/neutral/negative)", "Topic/theme extraction", "Trend-over-time charts", "Keyword cloud of complaints", "CSV/API ingestion"]
            }
        ],

        stack: { frontend: ["React", "Plotly.js"], backend: ["FastAPI", "Python"], database: ["PostgreSQL"] },
        advancedStack: { frontend: [], backend: ["Apache Airflow (pipelines)"], database: ["Data warehouse (BigQuery/Snowflake)"] },

        dbTables: [
            { name: "datasets", columns: ["id", "user_id", "name", "source", "uploaded_at"] },
            { name: "predictions", columns: ["id", "dataset_id", "result", "confidence", "created_at"] },
            { name: "models", columns: ["id", "name", "version", "metrics", "trained_at"] }
        ],
        advancedDbTable: { name: "pipeline_runs", columns: ["id", "pipeline_name", "status", "started_at", "finished_at"] },

        apiEndpoints: [
            { method: "POST", path: "/api/datasets", desc: "Upload a new dataset" },
            { method: "POST", path: "/api/predict", desc: "Run prediction on a dataset" },
            { method: "GET", path: "/api/predict/:id", desc: "Retrieve prediction results" },
            { method: "GET", path: "/api/models", desc: "List available trained models" }
        ],
        advancedApiEndpoints: [
            { method: "POST", path: "/api/pipelines/run", desc: "Trigger a data pipeline run" },
            { method: "GET", path: "/api/pipelines/:id", desc: "Get pipeline run status" }
        ],

        folderStructure:
`project-root/
├── frontend/
│   └── src/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   └── main.py
│   └── requirements.txt
├── notebooks/
├── data/
└── README.md`,

        deploymentSteps: ["Containerize the FastAPI service with Docker", "Schedule data refresh jobs (cron or Airflow)", "Deploy backend to Render/AWS", "Deploy the dashboard frontend to Vercel", "Store datasets in cloud object storage", "Set environment variables for DB & storage credentials"],
        advancedDeploymentSteps: ["Set up a data warehouse and ETL pipeline", "Add pipeline monitoring & alerting"],

        resumeValue: "Demonstrates the full data science lifecycle: ingestion, modeling, and a usable dashboard for stakeholders — valuable for data scientist and analytics engineer roles.",
        futureScope: ["Add automated model retraining on new data", "Support multiple forecasting models with comparison", "Add anomaly detection alerts", "Integrate with BI tools like Power BI/Tableau"],

        resources: [
            { title: "Pandas", resource: "Pandas Official Documentation" },
            { title: "scikit-learn", resource: "scikit-learn User Guide" },
            { title: "Plotly", resource: "Plotly.js Documentation" },
            { title: "Spark", resource: "Apache Spark Official Docs" }
        ],

        roadmapWeeksBase: ["Clean data & perform exploratory analysis", "Build & validate the prediction model", "Build the interactive dashboard"],
        roadmapWeeksAdvanced: ["Automate the data pipeline", "Add monitoring, then deploy"]

    },

    "Mobile App Development": {

        ideas: [
            {
                title: "Habit Tracker App with Reminders",
                problem: "People struggle to build consistent habits without gentle, timely nudges.",
                description: "A mobile app for tracking daily habits with streaks, reminders, and progress insights.",
                features: ["Custom habit creation with frequency", "Push notification reminders", "Streak tracking & badges", "Weekly progress charts", "Dark mode"]
            },
            {
                title: "Campus Event Discovery App",
                problem: "Students miss campus events because information is scattered across group chats and posters.",
                description: "An app that aggregates campus events in one place with RSVP and reminders.",
                features: ["Event feed filterable by category", "RSVP & calendar sync", "Push notifications for upcoming events", "Club/organizer profiles", "Search & bookmarking"]
            },
            {
                title: "Expense Splitting App for Roommates",
                problem: "Splitting shared expenses fairly and tracking who-owes-who gets messy over time.",
                description: "An app for groups to log shared expenses and automatically calculate balances.",
                features: ["Group creation & invites", "Expense logging with split rules", "Automatic balance calculation", "Settle-up payment tracking", "Expense history & charts"]
            }
        ],

        stack: { frontend: ["React Native", "Expo"], backend: ["Node.js", "Express"], database: ["Firebase Firestore"] },
        advancedStack: { frontend: ["Redux Toolkit"], backend: ["Push notification service (FCM)"], database: [] },

        dbTables: [
            { name: "users", columns: ["id", "name", "email", "device_token", "created_at"] },
            { name: "groups", columns: ["id", "name", "created_by", "created_at"] },
            { name: "entries", columns: ["id", "group_id", "type", "amount", "created_at"] }
        ],
        advancedDbTable: { name: "notifications", columns: ["id", "user_id", "message", "sent_at", "read"] },

        apiEndpoints: [
            { method: "POST", path: "/api/auth/login", desc: "Authenticate a user" },
            { method: "GET", path: "/api/groups", desc: "List a user's groups" },
            { method: "POST", path: "/api/entries", desc: "Log a new entry" },
            { method: "GET", path: "/api/entries/:groupId", desc: "Get entries for a group" }
        ],
        advancedApiEndpoints: [
            { method: "POST", path: "/api/notifications", desc: "Schedule a push notification" },
            { method: "PUT", path: "/api/entries/:id", desc: "Update an entry" }
        ],

        folderStructure:
`project-root/
├── app/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   └── App.tsx
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   └── index.js
│   └── package.json
└── README.md`,

        deploymentSteps: ["Set up a Firebase project for auth, database, and push notifications", "Build the app with Expo Application Services (EAS)", "Test on physical devices via TestFlight / Internal Testing track", "Submit to Google Play Console", "Submit to Apple App Store Connect", "Set up crash reporting (Sentry/Firebase Crashlytics)"],
        advancedDeploymentSteps: ["Set up CI/CD for automated builds with EAS Build", "Add over-the-air updates with Expo Updates"],

        resumeValue: "Shows you can ship a complete cross-platform mobile app — UI, backend integration, notifications, and app store submission — valuable for mobile developer roles.",
        futureScope: ["Add offline-first support with local sync", "Add social features (friends, leaderboards)", "Support an Apple Watch / Wear OS companion app", "Add an in-app analytics dashboard"],

        resources: [
            { title: "React Native", resource: "React Native Official Docs" },
            { title: "Expo", resource: "Expo Documentation" },
            { title: "Firebase", resource: "Firebase Documentation" }
        ],

        roadmapWeeksBase: ["Design UI/UX & set up navigation", "Build core screens & local state", "Integrate backend & auth"],
        roadmapWeeksAdvanced: ["Add push notifications & polish UX", "Test on devices, then submit to app stores"]

    },

    "Cybersecurity": {

        ideas: [
            {
                title: "Phishing URL Detector",
                problem: "Users frequently click malicious links because phishing sites mimic legitimate ones convincingly.",
                description: "A tool that analyzes URLs and page features to flag likely phishing attempts in real time.",
                features: ["URL feature extraction (domain age, SSL, etc.)", "ML-based phishing likelihood score", "Browser extension integration", "Real-time warning banner", "Report false positives"]
            },
            {
                title: "Network Intrusion Detection Dashboard",
                problem: "Small teams lack visibility into suspicious network activity without expensive enterprise tools.",
                description: "A dashboard that analyzes network traffic logs and flags anomalous patterns.",
                features: ["Traffic log ingestion", "Anomaly detection on connections", "Real-time alert feed", "Severity-based triage", "Exportable incident reports"]
            },
            {
                title: "Password Strength & Breach Checker",
                problem: "People reuse weak passwords without realizing they've been exposed in past breaches.",
                description: "A tool that scores password strength and checks against known breach databases safely, using k-anonymity.",
                features: ["Real-time strength scoring", "Breach database check (k-anonymity, no plaintext sent)", "Personalized improvement tips", "Passphrase generator", "Browser extension option"]
            }
        ],

        stack: { frontend: ["React", "Tailwind CSS"], backend: ["FastAPI", "Python"], database: ["PostgreSQL"] },
        advancedStack: { frontend: [], backend: ["Redis (rate limiting)"], database: ["Elasticsearch (log search)"] },

        dbTables: [
            { name: "users", columns: ["id", "name", "email", "password_hash", "created_at"] },
            { name: "scan_results", columns: ["id", "user_id", "target", "risk_score", "details", "created_at"] },
            { name: "alerts", columns: ["id", "source", "severity", "description", "created_at"] }
        ],
        advancedDbTable: { name: "audit_trail", columns: ["id", "user_id", "action", "ip_address", "created_at"] },

        apiEndpoints: [
            { method: "POST", path: "/api/scan/url", desc: "Analyze a URL for phishing risk" },
            { method: "GET", path: "/api/alerts", desc: "List recent security alerts" },
            { method: "POST", path: "/api/scan/password", desc: "Check password strength & breach status" },
            { method: "GET", path: "/api/scan/:id", desc: "Retrieve a past scan result" }
        ],
        advancedApiEndpoints: [
            { method: "GET", path: "/api/audit-trail", desc: "View recent account activity" },
            { method: "DELETE", path: "/api/scan/:id", desc: "Delete a saved scan" }
        ],

        folderStructure:
`project-root/
├── frontend/
│   └── src/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── detectors/
│   │   └── main.py
│   └── requirements.txt
└── README.md`,

        deploymentSteps: ["Containerize the FastAPI service with Docker", "Deploy backend to a hardened cloud instance with restricted ports", "Deploy frontend to Vercel/Netlify", "Set up HTTPS/TLS everywhere", "Store secrets in a vault, not plaintext .env, for production", "Enable logging & alerting for suspicious activity"],
        advancedDeploymentSteps: ["Add rate limiting & WAF rules", "Set up centralized log search with Elasticsearch"],

        resumeValue: "Demonstrates security-first engineering: safe handling of sensitive data, threat detection logic, and secure deployment — valuable for security engineering and SOC-adjacent roles.",
        futureScope: ["Add a browser extension for real-time protection", "Integrate threat intelligence feeds", "Add automated incident response playbooks", "Support team/organization accounts"],

        resources: [
            { title: "OWASP", resource: "OWASP Top 10 Documentation" },
            { title: "FastAPI", resource: "FastAPI Official Documentation" },
            { title: "Have I Been Pwned API", resource: "HIBP API Documentation" }
        ],

        roadmapWeeksBase: ["Study common attack patterns & data sources", "Build detection/scoring logic", "Build the dashboard/API layer"],
        roadmapWeeksAdvanced: ["Add alerting & rate limiting", "Harden deployment, then ship"]

    },

    "Cloud & DevOps": {

        ideas: [
            {
                title: "CI/CD Pipeline Visualizer",
                problem: "Teams often can't see pipeline health and failure trends across multiple repos at a glance.",
                description: "A dashboard that aggregates CI/CD run data and visualizes build health, duration, and failure trends.",
                features: ["Multi-repo pipeline status feed", "Build duration trend charts", "Failure rate by stage", "Slack/webhook alerts on failure", "Filter by branch/author"]
            },
            {
                title: "Multi-Cloud Cost Monitoring Dashboard",
                problem: "Teams using multiple cloud providers lose track of spend until the bill arrives.",
                description: "A dashboard that aggregates billing data from multiple providers and flags cost anomalies.",
                features: ["Cost aggregation across providers", "Budget threshold alerts", "Cost breakdown by service/team", "Anomaly detection on spend spikes", "Exportable cost reports"]
            },
            {
                title: "Auto-Scaling Container Orchestrator Demo",
                problem: "Learning container orchestration hands-on is hard without a safe sandbox to experiment in.",
                description: "A demo platform that lets users deploy sample containers and observe auto-scaling behavior under load.",
                features: ["One-click sample app deployment", "Live resource usage graphs", "Simulated load generator", "Auto-scaling event log", "Rollback to previous deployment"]
            }
        ],

        stack: { frontend: ["React", "Tailwind CSS"], backend: ["Node.js", "Express"], database: ["PostgreSQL"] },
        advancedStack: { frontend: [], backend: ["Kubernetes API integration"], database: ["Time-series DB (InfluxDB/Prometheus)"] },

        dbTables: [
            { name: "pipelines", columns: ["id", "repo_name", "status", "duration", "created_at"] },
            { name: "cost_records", columns: ["id", "provider", "service", "amount", "recorded_at"] },
            { name: "deployments", columns: ["id", "app_name", "version", "status", "deployed_at"] }
        ],
        advancedDbTable: { name: "scaling_events", columns: ["id", "deployment_id", "action", "replica_count", "created_at"] },

        apiEndpoints: [
            { method: "GET", path: "/api/pipelines", desc: "List recent pipeline runs" },
            { method: "POST", path: "/api/deployments", desc: "Trigger a new deployment" },
            { method: "GET", path: "/api/costs", desc: "Get aggregated cost data" },
            { method: "GET", path: "/api/deployments/:id", desc: "Get deployment status" }
        ],
        advancedApiEndpoints: [
            { method: "POST", path: "/api/scale", desc: "Manually trigger a scaling event" },
            { method: "GET", path: "/api/scaling-events", desc: "List recent scaling events" }
        ],

        folderStructure:
`project-root/
├── frontend/
│   └── src/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   └── index.js
│   └── package.json
├── infra/
│   ├── docker/
│   └── k8s/
└── README.md`,

        deploymentSteps: ["Containerize the app with Docker", "Set up a Kubernetes cluster, or a managed service like EKS/GKE", "Deploy backend & frontend as separate services", "Configure ingress & HTTPS", "Connect to cloud provider billing APIs", "Set up basic monitoring (Prometheus/Grafana)"],
        advancedDeploymentSteps: ["Configure a Horizontal Pod Autoscaler", "Add GitOps-based deployment (ArgoCD/Flux)"],

        resumeValue: "Demonstrates hands-on cloud infrastructure and observability skills — containerization, orchestration, and cost/performance monitoring — valuable for DevOps and platform engineering roles.",
        futureScope: ["Add multi-cluster support", "Add cost optimization recommendations", "Integrate with Terraform for infrastructure-as-code", "Add a Slack/Teams bot for alerts"],

        resources: [
            { title: "Docker", resource: "Docker Official Documentation" },
            { title: "Kubernetes", resource: "Kubernetes Official Docs" },
            { title: "Prometheus", resource: "Prometheus Documentation" },
            { title: "Terraform", resource: "Terraform Official Docs" }
        ],

        roadmapWeeksBase: ["Learn Docker & containerize a sample app", "Set up a basic CI/CD pipeline", "Build the dashboard & connect to APIs"],
        roadmapWeeksAdvanced: ["Set up Kubernetes & auto-scaling", "Add monitoring, then polish and deploy"]

    }

};

function buildProjectBlueprint(domain, ideaIndex, experience) {

    const tmpl = domainProjectTemplates[domain] || domainProjectTemplates["Web Development"];
    const idea = tmpl.ideas[ideaIndex] || tmpl.ideas[0];

    const isIntermediateOrAbove = experience !== "Beginner";
    const isAdvanced = experience === "Advanced";

    const stack = {
        frontend: [...tmpl.stack.frontend, ...(isAdvanced ? tmpl.advancedStack.frontend : [])],
        backend: [...tmpl.stack.backend, ...(isAdvanced ? tmpl.advancedStack.backend : [])],
        database: [...tmpl.stack.database, ...(isAdvanced ? tmpl.advancedStack.database : [])]
    };

    const dbTables = isAdvanced ? [...tmpl.dbTables, tmpl.advancedDbTable] : tmpl.dbTables;
    const apiEndpoints = isIntermediateOrAbove ? [...tmpl.apiEndpoints, ...tmpl.advancedApiEndpoints] : tmpl.apiEndpoints;
    const deploymentSteps = isAdvanced ? [...tmpl.deploymentSteps, ...tmpl.advancedDeploymentSteps] : tmpl.deploymentSteps;
    const roadmapWeeks = isIntermediateOrAbove ? [...tmpl.roadmapWeeksBase, ...tmpl.roadmapWeeksAdvanced] : tmpl.roadmapWeeksBase;

    return {
        title: idea.title,
        problem: idea.problem,
        description: idea.description,
        features: idea.features,
        difficulty: experience,
        duration: durationByExperience[experience] || durationByExperience["Beginner"],
        stack,
        dbTables,
        folderStructure: tmpl.folderStructure,
        apiEndpoints,
        repoStructure: standardRepoStructure,
        deploymentSteps,
        resumeValue: tmpl.resumeValue,
        futureScope: tmpl.futureScope,
        resources: tmpl.resources,
        roadmapWeeks,
        domain,
        savedAt: null
    };

}

// ---------- Rendering helpers ----------

function renderBadges(containerId, items) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = items.map(i => `<span class="skill-badge">${i}</span>`).join("")
        || '<span class="skill-badge">None required</span>';

}

function renderDbTables(containerId, tables) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = tables.map(t =>
        `<div class="candidate-box"><h3>${t.name}</h3><p>${t.columns.join(", ")}</p></div>`
    ).join("");

}

function renderApiTable(containerId, endpoints) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = endpoints.map(ep =>
        `<div class="api-row">
            <span class="api-method ${ep.method.toLowerCase()}">${ep.method}</span>
            <span class="api-path">${ep.path}</span>
            <span class="api-desc">${ep.desc}</span>
        </div>`
    ).join("");

}

function renderList(containerId, items) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = items.map(i => `<li>${i}</li>`).join("");

}

function renderResourceCards(containerId, resources) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = resources.map(r =>
        `<div class="candidate-box"><h3>${r.title}</h3><p>${r.resource}</p></div>`
    ).join("");

}

function renderRoadmapWeeks(containerId, weeks) {

    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = weeks.map((w, i) =>
        `<div class="goal-item"><strong>Week ${i + 1}</strong><span>${w}</span></div>`
    ).join("");

}

let currentProjectBlueprint = null;

function applyProjectBlueprint(blueprint) {

    [
        "projectOverviewCard", "techStackCard", "databaseDesignCard",
        "folderStructureCard", "apiEndpointsCard", "repoStructureCard",
        "deploymentGuideCard", "projectRoadmapCard", "learningResourcesCard",
        "resumeValueCard", "saveProjectCard"
    ].forEach(id => {

        const el = document.getElementById(id);
        if (el) el.hidden = false;

    });

    document.getElementById("projectTitleText").textContent = blueprint.title;
    document.getElementById("projectDifficultyBadge").textContent = blueprint.difficulty;
    document.getElementById("projectDurationText").textContent = `Estimated Duration: ${blueprint.duration}`;
    document.getElementById("projectProblemText").textContent = blueprint.problem;
    document.getElementById("projectDescriptionText").textContent = blueprint.description;
    renderList("projectFeaturesList", blueprint.features);

    renderBadges("techFrontend", blueprint.stack.frontend);
    renderBadges("techBackend", blueprint.stack.backend);
    renderBadges("techDatabase", blueprint.stack.database);

    renderDbTables("dbTablesList", blueprint.dbTables);

    document.getElementById("folderStructureText").textContent = blueprint.folderStructure;
    document.getElementById("repoStructureText").textContent = blueprint.repoStructure;

    renderApiTable("apiEndpointsList", blueprint.apiEndpoints);
    renderList("deploymentStepsList", blueprint.deploymentSteps);
    renderRoadmapWeeks("projectRoadmapWeeks", blueprint.roadmapWeeks);
    renderResourceCards("projectResourcesList", blueprint.resources);

    document.getElementById("resumeValueText").textContent = blueprint.resumeValue;
    renderList("futureScopeList", blueprint.futureScope);

    currentProjectBlueprint = blueprint;

    document.getElementById("projectOverviewCard").scrollIntoView({ behavior: "smooth", block: "start" });

}

// ---------- Form + recommendation selection ----------

const generateProjectsBtn = document.getElementById("generateProjects");
const saveProjectBtn = document.getElementById("saveProject");

const projectSkills = document.getElementById("projectSkills");
const careerGoal = document.getElementById("careerGoal");
const projectInterests = document.getElementById("projectInterests");
const projectDomain = document.getElementById("projectDomain");
const projectExperience = document.getElementById("projectExperience");

const projectRecommendations = document.getElementById("projectRecommendations");

if (generateProjectsBtn) {

    const generateDefaultLabel = generateProjectsBtn.innerHTML;

    generateProjectsBtn.addEventListener("click", () => {

        const skills = projectSkills.value.trim();
        const goal = careerGoal.value.trim();
        const domain = projectDomain.value;
        const experience = projectExperience.value;

        if (!skills || !goal) {

            showDashboardToast("Please enter your Skills and Career Goal.", "error");
            return;

        }

        generateProjectsBtn.disabled = true;
        generateProjectsBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating...';

        // ===============================
        // BACKEND INTEGRATION
        // ===============================
        // Real endpoint: POST /project/generate (no auth required). Body:
        // { skills, career_goal, interests, preferred_domain, experience_level }.
        // Returns ONE AI-generated project (not 3 options like the local
        // demo), so we render it as a single selectable card that opens
        // straight into the full blueprint.

        apiFetch("/project/generate", {
            method: "POST",
            body: {
                skills,
                career_goal: goal,
                interests: projectInterests.value.trim(),
                preferred_domain: domain,
                experience_level: experience
            }
        })
            .then((data) => {

                if (data.error) {
                    throw new Error(data.error);
                }

                const blueprint = {
                    title: data.title,
                    difficulty: data.difficulty || experience,
                    duration: data.duration || durationByExperience[experience] || "4–6 weeks",
                    problem: data.problem_statement,
                    description: data.description,
                    features: data.features || [],
                    stack: {
                        frontend: (data.tech_stack && data.tech_stack.frontend) || [],
                        backend: (data.tech_stack && data.tech_stack.backend) || [],
                        database: (data.tech_stack && data.tech_stack.database) || []
                    },
                    dbTables: (data.database_design || []).map(t => ({ table: t.table, fields: t.fields || [] })),
                    folderStructure: data.folder_structure || "",
                    repoStructure: standardRepoStructure,
                    apiEndpoints: data.api_endpoints || [],
                    deploymentSteps: data.deployment_steps || [],
                    roadmapWeeks: (data.learning_roadmap || []).map(w => ({ week: w.week, topics: w.topics || [] })),
                    resources: (data.learning_resources || []).map(r => ({ title: r.title, resource: r.url })),
                    resumeValue: data.resume_value || "",
                    futureScope: data.future_scope || []
                };

                projectRecommendations.innerHTML =
                    `<div class="project-card" data-idea-index="0" tabindex="0" role="button" aria-label="View full blueprint for ${blueprint.title}">
                        <div class="card-title">
                            <h3>${blueprint.title}</h3>
                            <span class="difficulty-badge">${blueprint.difficulty}</span>
                        </div>
                        <p>${blueprint.problem}</p>
                    </div>`;

                projectRecommendations.dataset.liveBlueprint = JSON.stringify(blueprint);

                generateProjectsBtn.disabled = false;
                generateProjectsBtn.innerHTML = generateDefaultLabel;

                showDashboardToast(`Project idea generated for ${domain}.`, "success");

            })
            .catch((err) => {

                console.error(err);

                const tmpl = domainProjectTemplates[domain] || domainProjectTemplates["Web Development"];

                delete projectRecommendations.dataset.liveBlueprint;

                projectRecommendations.innerHTML = tmpl.ideas.map((idea, i) =>
                    `<div class="project-card" data-idea-index="${i}" tabindex="0" role="button" aria-label="View full blueprint for ${idea.title}">
                        <div class="card-title">
                            <h3>${idea.title}</h3>
                            <span class="difficulty-badge">${experience}</span>
                        </div>
                        <p>${idea.problem}</p>
                    </div>`
                ).join("");

                generateProjectsBtn.disabled = false;
                generateProjectsBtn.innerHTML = generateDefaultLabel;

                showDashboardToast(`Live project API unavailable, showing local ideas for ${domain}.`, "error");

            });

    });

}

if (projectRecommendations) {

    projectRecommendations.addEventListener("click", (e) => {

        const card = e.target.closest(".project-card[data-idea-index]");
        if (!card) return;

        selectProjectOption(card);

    });

    projectRecommendations.addEventListener("keydown", (e) => {

        if (e.key !== "Enter" && e.key !== " ") return;

        const card = e.target.closest(".project-card[data-idea-index]");
        if (!card) return;

        e.preventDefault();
        selectProjectOption(card);

    });

}

function selectProjectOption(card) {

    projectRecommendations.querySelectorAll(".project-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    if (projectRecommendations.dataset.liveBlueprint) {
        applyProjectBlueprint(JSON.parse(projectRecommendations.dataset.liveBlueprint));
        return;
    }

    const ideaIndex = parseInt(card.dataset.ideaIndex, 10);
    const domain = projectDomain.value;
    const experience = projectExperience.value;

    applyProjectBlueprint(buildProjectBlueprint(domain, ideaIndex, experience));

}

// ---------- Save & Project History (persisted to localStorage) ----------

const PROJECT_HISTORY_KEY = "ai_helpdesk_project_history";

function getProjectHistory() {

    try {

        return JSON.parse(localStorage.getItem(PROJECT_HISTORY_KEY) || "[]");

    } catch (err) {

        return [];

    }

}

function renderProjectHistory() {

    const historyEl = document.getElementById("projectHistory");
    if (!historyEl) return;

    const history = getProjectHistory();

    if (history.length === 0) {

        historyEl.innerHTML =
            `<div class="history-item"><h3>No Saved Projects</h3><p>Your previously saved project blueprints will appear here.</p></div>`;
        return;

    }

    historyEl.innerHTML = history.map((p, i) =>
        `<div class="history-item">
            <h3>${p.title}</h3>
            <p>${p.domain} · ${p.difficulty} · ${new Date(p.savedAt).toLocaleDateString()}</p>
            <button type="button" class="link-btn" data-history-index="${i}">View Full Blueprint</button>
        </div>`
    ).join("");

}

if (saveProjectBtn) {

    saveProjectBtn.addEventListener("click", () => {

        if (!currentProjectBlueprint) {

            showDashboardToast("Generate and select a project first.", "error");
            return;

        }

        const history = getProjectHistory();
        const toSave = { ...currentProjectBlueprint, savedAt: new Date().toISOString() };

        history.unshift(toSave);
        localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));

        renderProjectHistory();
        showDashboardToast("Project saved to your history.", "success");
        window.logActivity?.(`Project blueprint saved: ${toSave.title}.`, "fa-diagram-project");

    });

}

const projectHistoryEl = document.getElementById("projectHistory");

if (projectHistoryEl) {

    projectHistoryEl.addEventListener("click", (e) => {

        const btn = e.target.closest("[data-history-index]");
        if (!btn) return;

        const history = getProjectHistory();
        const blueprint = history[parseInt(btn.dataset.historyIndex, 10)];

        if (blueprint) applyProjectBlueprint(blueprint);

    });

}

renderProjectHistory();


/* =====================================================
   INTERNSHIP RECOMMENDATION AGENT
===================================================== */

// ---------- Internship listing pool ----------
// Stands in for a real backend response — swap for the fetch()
// integration below once the Internship Recommendation API exists.
// Reuses the same 6 domains as Project Architect for consistency.

const internshipPool = [

    // Web Development
    { company: "Google", role: "Frontend Engineering Intern", domain: "Web Development", location: "Bengaluru", stipend: 40000, minCgpa: 8.0, requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Git"] },
    { company: "Startup", role: "Full Stack Intern", domain: "Web Development", location: "Remote", stipend: 15000, minCgpa: 6.5, requiredSkills: ["Node.js", "React", "MongoDB", "Git"] },
    { company: "Infosys", role: "Web Developer Intern", domain: "Web Development", location: "Pune", stipend: 20000, minCgpa: 7.0, requiredSkills: ["JavaScript", "HTML", "CSS", "REST APIs"] },

    // AI / Machine Learning
    { company: "Microsoft", role: "AI Research Intern", domain: "AI / Machine Learning", location: "Hyderabad", stipend: 50000, minCgpa: 8.5, requiredSkills: ["Python", "TensorFlow", "PyTorch", "Machine Learning"] },
    { company: "Amazon", role: "Machine Learning Intern", domain: "AI / Machine Learning", location: "Bengaluru", stipend: 45000, minCgpa: 8.0, requiredSkills: ["Python", "scikit-learn", "SQL", "Machine Learning"] },
    { company: "Startup", role: "AI Engineer Intern", domain: "AI / Machine Learning", location: "Remote", stipend: 18000, minCgpa: 7.0, requiredSkills: ["Python", "FastAPI", "Machine Learning", "SQL"] },

    // Data Science
    { company: "Amazon", role: "Data Science Intern", domain: "Data Science", location: "Bengaluru", stipend: 42000, minCgpa: 8.0, requiredSkills: ["Python", "Pandas", "SQL", "Statistics"] },
    { company: "TCS", role: "Data Analyst Intern", domain: "Data Science", location: "Chennai", stipend: 15000, minCgpa: 6.5, requiredSkills: ["SQL", "Excel", "Pandas", "Visualization"] },
    { company: "Startup", role: "Data Science Intern", domain: "Data Science", location: "Remote", stipend: 12000, minCgpa: 6.5, requiredSkills: ["Python", "Pandas", "Visualization"] },

    // Mobile App Development
    { company: "Google", role: "Android Engineering Intern", domain: "Mobile App Development", location: "Bengaluru", stipend: 45000, minCgpa: 8.0, requiredSkills: ["Kotlin", "Android SDK", "Git"] },
    { company: "Startup", role: "Mobile App Intern", domain: "Mobile App Development", location: "Remote", stipend: 12000, minCgpa: 6.5, requiredSkills: ["React Native", "Expo", "Firebase Firestore"] },
    { company: "Infosys", role: "Mobile Developer Intern", domain: "Mobile App Development", location: "Pune", stipend: 18000, minCgpa: 7.0, requiredSkills: ["React Native", "REST APIs", "Git"] },

    // Cybersecurity
    { company: "Microsoft", role: "Security Engineering Intern", domain: "Cybersecurity", location: "Hyderabad", stipend: 45000, minCgpa: 8.0, requiredSkills: ["Networking", "Python", "OWASP"] },
    { company: "TCS", role: "Cybersecurity Analyst Intern", domain: "Cybersecurity", location: "Chennai", stipend: 16000, minCgpa: 7.0, requiredSkills: ["Networking", "Linux", "OWASP"] },
    { company: "Startup", role: "Security Intern", domain: "Cybersecurity", location: "Remote", stipend: 12000, minCgpa: 6.5, requiredSkills: ["Python", "FastAPI", "Linux"] },

    // Cloud & DevOps
    { company: "Amazon", role: "Cloud Engineering Intern", domain: "Cloud & DevOps", location: "Bengaluru", stipend: 48000, minCgpa: 8.0, requiredSkills: ["Docker", "Kubernetes", "AWS"] },
    { company: "Microsoft", role: "DevOps Intern", domain: "Cloud & DevOps", location: "Hyderabad", stipend: 42000, minCgpa: 7.5, requiredSkills: ["Docker", "CI/CD", "Linux"] },
    { company: "Startup", role: "Cloud Intern", domain: "Cloud & DevOps", location: "Remote", stipend: 14000, minCgpa: 6.5, requiredSkills: ["Docker", "AWS", "Linux"] }

];

function scoreInternship(internship, userSkillsLower, prefs) {

    const required = internship.requiredSkills;
    const matched = required.filter(s => userSkillsLower.includes(s.toLowerCase()));
    const missing = required.filter(s => !userSkillsLower.includes(s.toLowerCase()));

    const skillRatio = required.length ? matched.length / required.length : 0;

    let score = skillRatio * 60;

    if (prefs.domain && internship.domain === prefs.domain) score += 20;

    if (prefs.role) {

        const roleWords = prefs.role.toLowerCase().split(/\s+/);
        const roleMatches = roleWords.some(w => w.length > 2 && internship.role.toLowerCase().includes(w));
        if (roleMatches) score += 10;

    }

    if (prefs.company === "No Preference" || prefs.company === internship.company) score += 5;

    if (!isNaN(prefs.cgpa) && prefs.cgpa >= internship.minCgpa) score += 5;

    if (prefs.location) {

        const loc = prefs.location.toLowerCase();

        if (internship.location.toLowerCase().includes(loc) || loc.includes("remote") && internship.location === "Remote") {

            score += 5;

        }

    }

    return {
        ...internship,
        matched,
        missing,
        score: Math.min(100, Math.round(score))
    };

}

function scoreTier(score) {

    if (score >= 80) return "tier-high";
    if (score >= 60) return "tier-mid";
    return "tier-low";

}

// ---------- DOM references ----------

const internshipSkills = document.getElementById("internshipSkills");
const internshipCgpa = document.getElementById("internshipCgpa");
const internshipRole = document.getElementById("internshipRole");
const internshipCompany = document.getElementById("internshipCompany");
const internshipDomain = document.getElementById("internshipDomain");
const internshipLocation = document.getElementById("internshipLocation");
const internshipStipend = document.getElementById("internshipStipend");
const internshipAvailability = document.getElementById("internshipAvailability");

const saveInternship = document.getElementById("saveInternship");

const internshipRecommendations = document.getElementById("internshipRecommendations");


// ---------- Resume upload (optional) ----------

let currentInternshipResumeFile = null;

const internshipUploadBtn = document.getElementById("internshipUploadBtn");
const internshipResumeFile = document.getElementById("internshipResumeFile");
const internshipUploadDropzone = document.getElementById("internshipUploadDropzone");
const internshipFileChip = document.getElementById("internshipFileChip");
const internshipFileName = document.getElementById("internshipFileName");
const internshipFileSize = document.getElementById("internshipFileSize");
const internshipFileRemove = document.getElementById("internshipFileRemove");

function setInternshipResumeFile(file) {

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {

        showDashboardToast("Please upload a PDF file.", "error");
        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        showDashboardToast("That file is over 5MB. Please upload a smaller PDF.", "error");
        return;

    }

    currentInternshipResumeFile = file;

    if (internshipFileName) internshipFileName.textContent = file.name;
    if (internshipFileSize) internshipFileSize.textContent = formatFileSize(file.size);
    if (internshipFileChip) internshipFileChip.hidden = false;

    showDashboardToast(`${file.name} uploaded successfully.`, "success");

}

function clearInternshipResumeFile() {

    currentInternshipResumeFile = null;
    if (internshipResumeFile) internshipResumeFile.value = "";
    if (internshipFileChip) internshipFileChip.hidden = true;

}

if (internshipUploadBtn && internshipResumeFile) {

    internshipUploadBtn.addEventListener("click", (e) => {

        e.stopPropagation();
        internshipResumeFile.click();

    });

    internshipResumeFile.addEventListener("change", () => {

        if (internshipResumeFile.files.length > 0) setInternshipResumeFile(internshipResumeFile.files[0]);

    });

}

if (internshipUploadDropzone) {

    internshipUploadDropzone.addEventListener("click", () => internshipResumeFile?.click());

    ["dragenter", "dragover"].forEach(evt => {

        internshipUploadDropzone.addEventListener(evt, (e) => {

            e.preventDefault();
            internshipUploadDropzone.classList.add("dragover");

        });

    });

    ["dragleave", "drop"].forEach(evt => {

        internshipUploadDropzone.addEventListener(evt, (e) => {

            e.preventDefault();
            internshipUploadDropzone.classList.remove("dragover");

        });

    });

    internshipUploadDropzone.addEventListener("drop", (e) => {

        const file = e.dataTransfer.files?.[0];
        if (file) setInternshipResumeFile(file);

    });

}

if (internshipFileRemove) {

    internshipFileRemove.addEventListener("click", (e) => {

        e.stopPropagation();
        clearInternshipResumeFile();

    });

}


// ---------- Rendering ----------

let currentInternshipResults = null;

function renderInternshipResults(results, prefs) {

    internshipRecommendations.innerHTML = results.map((r, i) =>
        `<div class="project-card">
            <div class="card-title">
                <h3>${r.company}</h3>
                <span class="match-score-badge ${scoreTier(r.score)}">${r.score}% Match</span>
            </div>
            <p class="internship-role">${r.role}</p>
            <div class="internship-meta">
                <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${r.location}</span>
                <span><i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i>${r.stipend.toLocaleString("en-IN")}/month</span>
            </div>
            ${r.missing.length ? `<div class="internship-missing-row">${r.missing.map(s => `<span class="skill-badge">${s}</span>`).join("")}</div>` : `<p style="color:#4ADE9C;font-size:13px;">All required skills matched!</p>`}
        </div>`
    ).join("");

    // Summary
    const summaryCard = document.getElementById("internshipSummaryCard");
    const summaryText = document.getElementById("internshipSummaryText");

    if (summaryCard) summaryCard.hidden = false;

    if (summaryText) {

        const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
        const top = results[0];

        summaryText.textContent =
            `Found ${results.length} strong matches for ${prefs.role || "your target role"} in ${prefs.domain}, ` +
            `averaging ${avgScore}% fit. Your best match is ${top.company} (${top.role}, ${top.score}% match). ` +
            `Focus on the missing skills below to raise your match score further.`;

    }

    // Match Score charts
    const matchScoreCard = document.getElementById("matchScoreCard");
    if (matchScoreCard) matchScoreCard.hidden = false;

    if (typeof Chart !== "undefined") {

        const barCanvas = document.getElementById("matchScoreChart");

        if (barCanvas) {

            if (barCanvas._chartInstance) barCanvas._chartInstance.destroy();

            barCanvas._chartInstance = new Chart(barCanvas, {

                type: "bar",
                data: {
                    labels: results.map(r => r.company),
                    datasets: [{
                        label: "Match Score",
                        data: results.map(r => r.score),
                        backgroundColor: results.map(r => r.score >= 80 ? "#4ADE9C" : r.score >= 60 ? "#FFC15E" : "#FF6B6B"),
                        borderRadius: 8,
                        maxBarThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: "rgba(10,20,45,.95)",
                            borderColor: "rgba(255,255,255,.15)",
                            borderWidth: 1,
                            padding: 12,
                            callbacks: { label: (item) => ` ${item.parsed.y}% match` }
                        }
                    },
                    scales: {
                        y: { min: 0, max: 100, grid: { color: "rgba(255,255,255,.08)" }, ticks: { callback: (v) => v + "%" } },
                        x: { grid: { display: false } }
                    }
                }

            });

        }

        const doughnutCanvas = document.getElementById("avgMatchChart");

        if (doughnutCanvas) {

            const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

            if (doughnutCanvas._chartInstance) doughnutCanvas._chartInstance.destroy();

            doughnutCanvas._chartInstance = new Chart(doughnutCanvas, {

                type: "doughnut",
                data: {
                    labels: ["Match", "Gap"],
                    datasets: [{
                        data: [avgScore, 100 - avgScore],
                        backgroundColor: ["#8A2BE2", "rgba(255,255,255,.08)"],
                        borderWidth: 0,
                        cutout: "78%"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                }

            });

            const avgMatchValue = document.getElementById("avgMatchValue");
            if (avgMatchValue) avgMatchValue.textContent = `${avgScore}%`;

        }

    }

    // Missing skills (aggregate, unique, most common first)
    const missingCounts = {};

    results.forEach(r => r.missing.forEach(s => {

        missingCounts[s] = (missingCounts[s] || 0) + 1;

    }));

    const aggregateMissing = Object.keys(missingCounts).sort((a, b) => missingCounts[b] - missingCounts[a]);

    const missingSkillsCard = document.getElementById("missingSkillsCard");
    if (missingSkillsCard) missingSkillsCard.hidden = aggregateMissing.length === 0;

    renderSkillChips("internshipMissingSkills", aggregateMissing);

    // Learning resources — reuse the shared library from the Learning Planner
    const resourcesCard = document.getElementById("internshipResourcesCard");
    if (resourcesCard) resourcesCard.hidden = aggregateMissing.length === 0;

    const resources = aggregateMissing.map(skill => {

        const match = typeof learningResourceLibrary !== "undefined" ? learningResourceLibrary[skill.toLowerCase()] : null;
        return match || { title: skill, resource: "Explore official docs and community tutorials" };

    });

    renderResourceCards("internshipResourcesList", resources);

    const saveCard = document.getElementById("saveInternshipCard");
    if (saveCard) saveCard.hidden = false;

    currentInternshipResults = { results, prefs, aggregateMissing };

}

// ---------- Save & History (persisted to localStorage) ----------

const INTERNSHIP_HISTORY_KEY = "ai_helpdesk_internship_history";

function getInternshipHistory() {

    try {

        return JSON.parse(localStorage.getItem(INTERNSHIP_HISTORY_KEY) || "[]");

    } catch (err) {

        return [];

    }

}

function renderInternshipHistory() {

    const historyEl = document.getElementById("internshipHistory");
    if (!historyEl) return;

    const history = getInternshipHistory();

    if (history.length === 0) {

        historyEl.innerHTML =
            `<div class="history-item"><h3>No Saved Recommendations</h3><p>Your previous internship recommendations will appear here.</p></div>`;
        return;

    }

    historyEl.innerHTML = history.map((h, i) =>
        `<div class="history-item">
            <h3>${h.results[0].company} — ${h.results[0].role}</h3>
            <p>${h.prefs.domain} · Top match ${h.results[0].score}% · ${new Date(h.savedAt).toLocaleDateString()}</p>
            <button type="button" class="link-btn" data-internship-history-index="${i}">View Full Results</button>
        </div>`
    ).join("");

}

if (saveInternship) {

    saveInternship.addEventListener("click", () => {

        if (!currentInternshipResults) {

            showDashboardToast("Generate recommendations first.", "error");
            return;

        }

        const history = getInternshipHistory();

        history.unshift({ ...currentInternshipResults, savedAt: new Date().toISOString() });
        localStorage.setItem(INTERNSHIP_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));

        renderInternshipHistory();
        showDashboardToast("Recommendation saved to your history.", "success");
        window.logActivity?.(`Internship recommendation saved: ${currentInternshipResults.results[0].company}.`, "fa-bookmark");

    });

}

const internshipHistoryEl = document.getElementById("internshipHistory");

if (internshipHistoryEl) {

    internshipHistoryEl.addEventListener("click", (e) => {

        const btn = e.target.closest("[data-internship-history-index]");
        if (!btn) return;

        const history = getInternshipHistory();
        const saved = history[parseInt(btn.dataset.internshipHistoryIndex, 10)];

        if (saved) renderInternshipResults(saved.results, saved.prefs);

    });

}

renderInternshipHistory();
// ===========================================
// INTERNSHIP AGENT
// ===========================================
// ===========================================
// INTERNSHIP AGENT
// ===========================================

const internshipBtn = document.getElementById("generateInternship");

if (internshipBtn) {
    internshipBtn.addEventListener("click", generateInternship);
}

async function generateInternship() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        showDashboardToast("Please log in first.", "error");
        return;
    }

    const body = {

        skills: document.getElementById("internshipSkills").value,

        cgpa: Number(document.getElementById("internshipCgpa").value),

        location: document.getElementById("internshipLocation").value,

        preferred_role: document.getElementById("internshipRole").value,

        preferred_company: document.getElementById("internshipCompany").value,

        preferred_domain: document.getElementById("internshipDomain").value,

        expected_stipend: document.getElementById("internshipStipend").value,

        availability: document.getElementById("internshipAvailability").value

    };

    try {

        const data = await apiFetch("/internship/recommend", { method: "POST", body, auth: true });

        console.log(data);

        showDashboardToast("Internship recommendations generated successfully!", "success");
        window.logActivity?.("Internship recommendations generated.", "fa-briefcase");

    } catch (err) {

        console.error(err);

        showDashboardToast(err.message, "error");

    }
}
/* ===========================================
        RESUME ANALYZER
=========================================== */
// NOTE (fixed critical bug): `analyzeResumeBtn` was declared with `const`
// a second time here, duplicating the declaration at the top of the
// Resume Analyzer section (~line 1502). Two `const` declarations of the
// same identifier in the same scope is a SyntaxError, which meant this
// entire file failed to parse and NONE of the dashboard's JavaScript ran
// in any browser. Reusing the existing binding instead.

if (analyzeResumeBtn) {
    analyzeResumeBtn.addEventListener("click", analyzeResume);
}

async function analyzeResume() {

    const token = localStorage.getItem("access_token");

    if (!token) {
        showDashboardToast("Please log in first.", "error");
        return;
    }

    const targetRole = document.getElementById("resumeRole").value;

    if (!targetRole) {
        showDashboardToast("Please enter a target role.", "error");
        return;
    }

    // NOTE (fixed integration gap): this used to POST /resume/analyze with
    // only { target_role, file_name } — the backend had no field to receive
    // actual resume content, so real analysis was never possible even
    // though this call "succeeded" at the network level. It now uploads
    // the actual PDF to the new POST /resume/upload endpoint, which
    // extracts the text server-side.

    if (!currentResumeFile) {
        showDashboardToast("Please upload a PDF resume first.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("target_role", targetRole);
    formData.append("file", currentResumeFile);

    try {

        const data = await apiFetch("/resume/upload", { method: "POST", formData, auth: true });

        lastAnalysis = {
            role: targetRole,
            score: data.analysis && typeof data.analysis.overall_score === "number" ? data.analysis.overall_score : null,
            strengths: (data.analysis && data.analysis.strengths) || [],
            weaknesses: (data.analysis && data.analysis.weaknesses) || []
        };

        displayResumeAnalysis(data.analysis);

        showDashboardToast("Resume analyzed successfully!", "success");
        window.logActivity?.(`Resume analyzed for ${targetRole}.`, "fa-file-lines");

    }

    catch (err) {

        console.error(err);

        showDashboardToast(err.message, "error");

    }

}
function displayResumeAnalysis(analysis) {

    // NOTE: the real /resume/upload response only returns overall_score
    // (see prompts/resume_prompt.py) — it has no separate ats_score,
    // skills_score, or projects_score. Default those to overall_score so
    // the progress bars don't render "undefined%" against live data.
    const overall = typeof analysis.overall_score === "number" ? analysis.overall_score : 0;
    const atsScore = typeof analysis.ats_score === "number" ? analysis.ats_score : overall;
    const skillsScore = typeof analysis.skills_score === "number" ? analysis.skills_score : overall;
    const projectsScore = typeof analysis.projects_score === "number" ? analysis.projects_score : overall;

    // Score
    document.getElementById("scoreValue").innerText =
        overall + "%";

    document
        .getElementById("scoreCircle")
        .style.setProperty("--score", overall);

    // Summary
    document.getElementById("aiSummaryText").innerText =
        analysis.summary;

    // Strengths
    const strengths = document.getElementById("strengthsList");

    strengths.innerHTML = "";

    (analysis.strengths || []).forEach(item => {

        strengths.innerHTML += `<span>${item}</span>`;

    });

    // Weaknesses
    const weaknesses = document.getElementById("weaknessesList");

    weaknesses.innerHTML = "";

    (analysis.weaknesses || []).forEach(item => {

        weaknesses.innerHTML += `<span>${item}</span>`;

    });

    // Missing Keywords
    const keywords = document.getElementById("missingKeywordsList");

    keywords.innerHTML = "";

    (analysis.missing_keywords || []).forEach(item => {

        keywords.innerHTML += `<span>${item}</span>`;

    });

    // Progress Bars
    document.getElementById("atsPercentLabel").innerText = atsScore + "%";
    document.getElementById("atsProgress").style.width = atsScore + "%";

    document.getElementById("skillsPercentLabel").innerText = skillsScore + "%";
    document.getElementById("skillsProgress").style.width = skillsScore + "%";

    document.getElementById("projectPercentLabel").innerText = projectsScore + "%";
    document.getElementById("projectProgress").style.width = projectsScore + "%";

    document.getElementById("overallPercentLabel").innerText = overall + "%";
    document.getElementById("overallProgress").style.width = overall + "%";
}