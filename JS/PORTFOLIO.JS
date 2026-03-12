// typing animation

const words = ["Livestreams","Photography","Videos","Websites"]
let i = 0

setInterval(()=>{
document.getElementById("typing").innerText = words[i]
i = (i+1) % words.length
},2000)


// lightbox

const images = document.querySelectorAll(".gallery-item")
const lightbox = document.getElementById("lightbox")
const lightboxImg = document.getElementById("lightbox-img")

images.forEach(img=>{
img.onclick = () => {
lightbox.style.display="flex"
lightboxImg.src = img.src
}
})

lightbox.onclick=()=>{
lightbox.style.display="none"
}


// counter animation

const counters = document.querySelectorAll('.counter')

counters.forEach(counter => {

counter.innerText = '0'

const update = () => {

const target = +counter.getAttribute('data-target')
const c = +counter.innerText
const increment = target / 200

if(c < target){
counter.innerText = Math.ceil(c + increment)
setTimeout(update,10)
}else{
counter.innerText = target
}

}

update()

})


// scroll reveal animation

function reveal(){

const reveals = document.querySelectorAll(".reveal")

for(let i=0;i<reveals.length;i++){

let windowHeight = window.innerHeight
let revealTop = reveals[i].getBoundingClientRect().top
let revealPoint = 100

if(revealTop < windowHeight - revealPoint){
reveals[i].classList.add("active")
}

}

}

window.addEventListener("scroll", reveal)
