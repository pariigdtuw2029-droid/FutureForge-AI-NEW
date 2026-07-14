/*=====================================================
        AI HELPDESK AGENT
        PREMIUM JAVASCRIPT
        PART 1
======================================================*/

/*==========================
    SHARED CAPABILITY FLAGS
    (used across several effects
    below to keep the site fast
    and comfortable on mobile /
    reduced-motion setups)
==========================*/

const prefersReducedMotion=window.matchMedia(
"(prefers-reduced-motion: reduce)"
).matches;

const supportsHover=window.matchMedia("(hover: hover)").matches;


/*==========================
    PAGE LOADER
==========================*/

window.addEventListener("load",()=>{

document.body.classList.add("loaded");

});


/*==========================
    STICKY NAVBAR
==========================*/

const header=document.querySelector("header");

window.addEventListener("scroll",()=>{

if(window.scrollY>80){

header.classList.add("sticky");

}

else{

header.classList.remove("sticky");

}

});


/*==========================
    SMOOTH SCROLL
==========================*/

document.querySelectorAll('a[href^="#"]').forEach(anchor=>{

anchor.addEventListener("click",function(e){

e.preventDefault();

const target=document.querySelector(this.getAttribute("href"));

if(target){

target.scrollIntoView({

behavior:"smooth"

});

}

});

});


/*==========================
    ACTIVE NAV LINK
==========================*/

const sections=document.querySelectorAll("section");

const navLinks=document.querySelectorAll("nav a");

window.addEventListener("scroll",()=>{

let current="";

sections.forEach(section=>{

const top=section.offsetTop-180;

const height=section.clientHeight;

if(window.scrollY>=top){

current=section.getAttribute("id");

}

});

navLinks.forEach(link=>{

link.classList.remove("active");

if(link.getAttribute("href")==="#"+current){

link.classList.add("active");

}

});

});


/*==========================
    HERO TYPING EFFECT
==========================*/

const typing=document.getElementById("typing");

const words=[

"AI HelpDesk Agent",

"Build Resume Smarter",

"Master Interviews",

"Track Your Skills",

"Land Your Dream Internship",

"Become Industry Ready"

];

let wordIndex=0;

let charIndex=0;

let deleting=false;

function typeEffect(){

const currentWord=words[wordIndex];

if(!deleting){

typing.textContent=currentWord.substring(0,charIndex);

charIndex++;

if(charIndex>currentWord.length){

deleting=true;

setTimeout(typeEffect,1500);

return;

}

}

else{

typing.textContent=currentWord.substring(0,charIndex);

charIndex--;

if(charIndex<0){

deleting=false;

wordIndex++;

if(wordIndex>=words.length){

wordIndex=0;

}

}

}

setTimeout(typeEffect,deleting?45:90);

}

typeEffect();


/*==========================
    HERO BUTTON HOVER
==========================*/

document.querySelectorAll(".primary-btn").forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

btn.classList.add("btn-hover");

});

btn.addEventListener("mouseleave",()=>{

btn.classList.remove("btn-hover");

});

});


/*==========================
    FLOATING AI ORB
==========================*/

const orb=document.querySelector(".ai-orb");

let orbFloatAngle=0;
let orbRotationAngle=0;

// Both the float and the rotation loops write into these two variables,
// and a single function applies the combined transform so the two
// animations don't stomp on each other's `transform` value.
function applyOrbTransform(){

if(!orb) return;

orb.style.transform=

`translateY(${Math.sin(orbFloatAngle)*10}px) rotate(${orbRotationAngle}deg)`;

}

function animateOrb(){

orbFloatAngle+=0.01;

applyOrbTransform();

requestAnimationFrame(animateOrb);

}

if(orb){

animateOrb();

}


/*==========================
    FLOATING CARDS
==========================*/

const cards=document.querySelectorAll(".floating-card");

cards.forEach((card,index)=>{

let offset=index*2;

function floatCard(){

offset+=0.02;

card.style.transform=

`translateY(${Math.sin(offset)*12}px)`;

requestAnimationFrame(floatCard);

}

floatCard();

});


/*==========================
    CONSOLE MESSAGE
==========================*/

console.log(

"%cAI HelpDesk Agent",

"color:#ff4fd8;font-size:24px;font-weight:bold;"

);

console.log(

"%cDesigned by Prachi 🚀",

"color:#8a2be2;font-size:15px;"

);
/*=====================================================
        AI HELPDESK AGENT
        PREMIUM JAVASCRIPT
        PART 2
======================================================*/


/*==========================
      SCROLL REVEAL
==========================*/

const revealElements=document.querySelectorAll(

".agent-card,.feature-card,.dashboard-card,.timeline-item,.testimonial-card,.faq-item,.contact,.hero-left,.hero-right"

);

const revealObserver=new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

},

{

threshold:.2

}

);

revealElements.forEach(element=>{

element.classList.add("hidden");

revealObserver.observe(element);

});


/*==========================
      COUNTER ANIMATION
==========================*/

const counters=document.querySelectorAll(".hero-stats h2");

let counterStarted=false;

function animateCounters(){

if(counterStarted) return;

counterStarted=true;

counters.forEach(counter=>{

const targetText=counter.innerText;

const target=parseInt(targetText.replace(/\D/g,""));

const suffix=targetText.replace(/[0-9]/g,"");

let current=0;

const increment=Math.max(1,Math.ceil(target/120));

const timer=setInterval(()=>{

current+=increment;

if(current>=target){

counter.innerText=target+suffix;

clearInterval(timer);

}

else{

counter.innerText=current+suffix;

}

},18);

});

}

window.addEventListener("scroll",()=>{

const heroStats=document.querySelector(".hero-stats");

if(!heroStats) return;

const position=heroStats.getBoundingClientRect().top;

if(position<window.innerHeight-100){

animateCounters();

}

});


/*==========================
      PROGRESS BAR ANIMATION
==========================*/

const progressBars=document.querySelectorAll(".progress-fill");

const progressObserver=new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

const width=entry.target.style.width ||

window.getComputedStyle(entry.target).width;

entry.target.style.width="0";

setTimeout(()=>{

entry.target.style.transition="1.5s ease";

entry.target.style.width=width;

},200);

}

});

},

{

threshold:.4

}

);

progressBars.forEach(bar=>{

progressObserver.observe(bar);

});


/*==========================
      TIMELINE EFFECT
==========================*/

const timeline=document.querySelectorAll(".timeline-item");

timeline.forEach((item,index)=>{

item.style.transition=".7s";

item.style.transitionDelay=`${index*0.2}s`;

});


/*==========================
      PARALLAX HERO
==========================*/

if(supportsHover && !prefersReducedMotion){

window.addEventListener("mousemove",(e)=>{

const x=(window.innerWidth/2-e.clientX)/35;

const y=(window.innerHeight/2-e.clientY)/35;

const heroRight=document.querySelector(".hero-right");

if(heroRight){

heroRight.style.transform=`translate(${x}px,${y}px)`;

}

});

}


/*==========================
      SCROLL TO TOP
==========================*/

const scrollButton=document.createElement("button");

scrollButton.innerHTML="↑";

scrollButton.className="scroll-top";

document.body.appendChild(scrollButton);

window.addEventListener("scroll",()=>{

if(window.scrollY>500){

scrollButton.classList.add("active");

}

else{

scrollButton.classList.remove("active");

}

});

scrollButton.addEventListener("click",()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

});
/*=====================================================
        AI HELPDESK AGENT
        PREMIUM JAVASCRIPT
        PART 3
======================================================*/


/*==========================
      CUSTOM CURSOR GLOW
==========================*/

if(supportsHover && !prefersReducedMotion){

const cursor=document.createElement("div");
cursor.className="cursor-glow";
document.body.appendChild(cursor);

document.addEventListener("mousemove",(e)=>{

cursor.style.left=e.clientX+"px";
cursor.style.top=e.clientY+"px";

});

}


/*==========================
      FLOATING PARTICLES
==========================*/

// Fewer particles on small / low-power screens, none for reduced-motion users
const particleCount=prefersReducedMotion?0:(window.innerWidth<768?40:120);

if(particleCount>0){

const particleContainer=document.createElement("div");

particleContainer.className="particles";

document.body.appendChild(particleContainer);

for(let i=0;i<particleCount;i++){

const particle=document.createElement("span");

particle.className="particle";

particle.style.left=Math.random()*100+"vw";

particle.style.animationDuration=
(Math.random()*12+8)+"s";

particle.style.animationDelay=
Math.random()*8+"s";

particle.style.opacity=Math.random();

particle.style.width=
(Math.random()*5+2)+"px";

particle.style.height=
particle.style.width;

particleContainer.appendChild(particle);

}

}


/*==========================
      3D CARD TILT
==========================*/

if(supportsHover && !prefersReducedMotion){

const tiltCards=document.querySelectorAll(

".feature-card,.agent-card,.testimonial-card,.dashboard-card"

);

tiltCards.forEach(card=>{

card.addEventListener("mousemove",(e)=>{

const rect=card.getBoundingClientRect();

const x=e.clientX-rect.left;

const y=e.clientY-rect.top;

const rotateY=((x-rect.width/2)/18);

const rotateX=((rect.height/2-y)/18);

card.style.transform=

`perspective(1000px)
rotateX(${rotateX}deg)
rotateY(${rotateY}deg)
translateY(-8px)`;

});

card.addEventListener("mouseleave",()=>{

card.style.transform=

"perspective(1000px) rotateX(0deg) rotateY(0deg)";

});

});

}


/*==========================
      HERO PARALLAX
==========================*/

if(supportsHover && !prefersReducedMotion){

window.addEventListener("mousemove",(e)=>{

const hero=document.querySelector(".hero");

if(!hero) return;

const x=(window.innerWidth/2-e.clientX)/60;

const y=(window.innerHeight/2-e.clientY)/60;

hero.style.backgroundPosition=`${x}px ${y}px`;

});

}


/*==========================
      AI ORB ROTATION
==========================*/

function rotateOrb(){

orbRotationAngle+=0.25;

applyOrbTransform();

requestAnimationFrame(rotateOrb);

}

if(orb){

rotateOrb();

}


/*==========================
      RANDOM GLOW
==========================*/

setInterval(()=>{

const cards=document.querySelectorAll(

".feature-card,.agent-card"

);

const random=

cards[Math.floor(Math.random()*cards.length)];

if(random){

random.classList.add("glow-card");

setTimeout(()=>{

random.classList.remove("glow-card");

},1500);

}

},2500);


/*==========================
      BUTTON RIPPLE
==========================*/

document.querySelectorAll("button").forEach(button=>{

button.addEventListener("click",function(e){

const ripple=document.createElement("span");

ripple.className="ripple";

const rect=this.getBoundingClientRect();

ripple.style.left=e.clientX-rect.left+"px";

ripple.style.top=e.clientY-rect.top+"px";

this.appendChild(ripple);

setTimeout(()=>{

ripple.remove();

},700);

});

});


/*==========================
      CONSOLE MESSAGE
==========================*/

console.log(
"%c✨ Premium AI HelpDesk Agent Loaded",
"color:#ff4fd8;font-size:20px;font-weight:bold;"
);
/*=====================================================
        AI HELPDESK AGENT
        PREMIUM JAVASCRIPT
        PART 4
======================================================*/


/*==========================
        FAQ ACCORDION
==========================*/

const faqItems=document.querySelectorAll(".faq-item");

faqItems.forEach(item=>{

const button=item.querySelector(".faq-question");

button.addEventListener("click",()=>{

faqItems.forEach(faq=>{

if(faq!==item){

faq.classList.remove("active");

}

});

item.classList.toggle("active");

});

});


/*==========================
      CONTACT FORM
==========================*/

const form=document.querySelector("form");

if(form){

form.addEventListener("submit",(e)=>{

e.preventDefault();

const name=form.querySelector('input[type="text"]').value.trim();

const email=form.querySelector('input[type="email"]').value.trim();

const message=form.querySelector("textarea").value.trim();

if(name===""||email===""||message===""){

showToast("Please fill in all fields.","error");

return;

}

const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailRegex.test(email)){

showToast("Please enter a valid email.","error");

return;

}

showToast("Message sent successfully! 🚀","success");

form.reset();

});

}


/*==========================
      TOAST MESSAGE
==========================*/

function showToast(message,type){

const toast=document.createElement("div");

toast.className="toast";

if(type==="success"){

toast.classList.add("success");

}

else{

toast.classList.add("error");

}

toast.innerHTML=message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.classList.add("show");

},100);

setTimeout(()=>{

toast.classList.remove("show");

setTimeout(()=>{

toast.remove();

},500);

},3000);

}


/*==========================
      MOBILE MENU
==========================*/

const nav=document.querySelector("nav");
const navButtons=document.querySelector(".nav-buttons");
const navOverlay=document.querySelector(".nav-overlay");

const menu=document.createElement("button");

menu.className="menu-toggle";
menu.type="button";
menu.setAttribute("aria-label","Open menu");
menu.setAttribute("aria-expanded","false");
menu.innerHTML='<i class="fa-solid fa-bars" aria-hidden="true"></i>';

document.querySelector("header").appendChild(menu);

function closeMobileNav(){

nav.classList.remove("mobile-nav");
if(navButtons) navButtons.classList.remove("mobile-nav");
if(navOverlay) navOverlay.classList.remove("active");
menu.setAttribute("aria-expanded","false");
menu.innerHTML='<i class="fa-solid fa-bars" aria-hidden="true"></i>';
menu.setAttribute("aria-label","Open menu");

}

function openMobileNav(){

nav.classList.add("mobile-nav");
if(navButtons) navButtons.classList.add("mobile-nav");
if(navOverlay) navOverlay.classList.add("active");
menu.setAttribute("aria-expanded","true");
menu.innerHTML='<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
menu.setAttribute("aria-label","Close menu");

}

menu.addEventListener("click",()=>{

if(nav.classList.contains("mobile-nav")){

closeMobileNav();

}else{

openMobileNav();

}

});

if(navOverlay){

navOverlay.addEventListener("click",closeMobileNav);

}

// Close the panel whenever a nav link is tapped
nav.querySelectorAll("a").forEach(link=>{

link.addEventListener("click",closeMobileNav);

});


/*==========================
      KEYBOARD SHORTCUT
==========================*/

document.addEventListener("keydown",(e)=>{

if(e.key==="Escape"){

closeMobileNav();

}

});


/*==========================
      RANDOM BACKGROUND GLOW
==========================*/

setInterval(()=>{

const auroras=document.querySelectorAll(".aurora");

auroras.forEach(a=>{

a.style.opacity=(Math.random()*0.25+0.25);

});

},4000);


/*==========================
      BUTTON CLICK SCALE
==========================*/

document.querySelectorAll("button").forEach(button=>{

button.addEventListener("mousedown",()=>{

button.classList.add("btn-press");

});

const releasePress=()=>button.classList.remove("btn-press");

button.addEventListener("mouseup",releasePress);
button.addEventListener("mouseleave",releasePress);

});


/*==========================
      PERFORMANCE
==========================*/

window.addEventListener("resize",()=>{

document.body.style.overflowX="hidden";

});


/*==========================
      FOOTER YEAR
==========================*/

const footer=document.querySelector(".footer-bottom p");

if(footer){

footer.innerHTML=`© ${new Date().getFullYear()} AI HelpDesk Agent. All Rights Reserved.`;

}


/*==========================
      WEBSITE READY
==========================*/

window.addEventListener("load",()=>{

console.clear();

console.log(

"%c🚀 AI HelpDesk Agent Ready",

"color:#ff4fd8;font-size:22px;font-weight:bold;"

);

console.log(

"%cMade with ❤️ HTML CSS JavaScript",

"color:#8a2be2;font-size:16px;"

);

});