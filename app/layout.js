import "./globals.css";

const siteUrl="https://www.xn--yksekuura-q9a70i.com.tr";

export const metadata={
 metadataBase:new URL(siteUrl),
 title:{default:"Yüksek Şuura | Spor Kulübü ve Dijital Topluluk",template:"%s | Yüksek Şuura"},
 description:"Yüksek Şuura; spor, dostluk, etkinlikler ve ortak kültür etrafında bir araya gelen topluluğun resmi dijital platformudur.",
 applicationName:"Yüksek Şuura",
 keywords:["Yüksek Şuura","Yüksek Şuura Spor Kulübü","Yüksek Şuura Aksaray","Dijital Şuura","spor kulübü","Aksaray spor topluluğu"],
 authors:[{name:"Yüksek Şuura"}],
 creator:"Yüksek Şuura",
 publisher:"Yüksek Şuura",
 alternates:{canonical:"/"},
 openGraph:{type:"website",locale:"tr_TR",url:"/",siteName:"Yüksek Şuura",title:"Yüksek Şuura | Spor Kulübü ve Dijital Topluluk",description:"Yüksek Şuura'nın spor, etkinlik ve dijital topluluk platformu."},
 twitter:{card:"summary",title:"Yüksek Şuura",description:"Spor, dostluk, etkinlikler ve dijital topluluk."},
 robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
 category:"sports"
};

const organization={
 "@context":"https://schema.org","@type":["Organization","SportsClub"],"name":"Yüksek Şuura","alternateName":["Yüksek Şuura Spor Kulübü","Dijital Şuura"],"url":siteUrl,
 "description":"Spor, dostluk, etkinlikler ve ortak kültür etrafında bir araya gelen Yüksek Şuura topluluğu."
};

export default function RootLayout({children}){return <html lang="tr"><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organization).replace(/</g,"\\u003c")}}/></body></html>}
