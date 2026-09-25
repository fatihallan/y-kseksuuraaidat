import Link from "next/link";
import {ArrowLeft,CalendarDays,ShieldCheck,Users,Trophy} from "lucide-react";
import "./spor.css";

export const metadata={
 title:"Yüksek Şuura Spor Kulübü",
 description:"Yüksek Şuura Spor Kulübü; dostluk, takım ruhu, spor etkinlikleri ve ortak kültürü bir araya getiren Yüksek Şuura topluluğunun spor yapılanmasıdır.",
 alternates:{canonical:"/spor-kulubu"},
 openGraph:{title:"Yüksek Şuura Spor Kulübü",description:"Takım ruhu, dostluk ve spor etkinlikleriyle Yüksek Şuura.",url:"/spor-kulubu"}
};

export default function SporKulubu(){
 const schema={"@context":"https://schema.org","@type":"SportsClub",name:"Yüksek Şuura Spor Kulübü",url:"https://www.xn--yksekuura-q9a70i.com.tr/spor-kulubu",parentOrganization:{"@type":"Organization",name:"Yüksek Şuura",url:"https://www.xn--yksekuura-q9a70i.com.tr"}};
 return <main className="sportPage">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  <header><Link href="/"><ArrowLeft size={18}/> Ana Sayfa</Link><span>YÜKSEK ŞUURA</span></header>
  <section className="sportHero"><div className="sportKicker">YÜKSEK ŞUURA • SPOR KULÜBÜ</div><h1>Yüksek Şuura<br/><em>Spor Kulübü</em></h1><p>Dostluğu sahaya taşıyan; takım ruhunu, düzenli spor etkinliklerini ve ortak kültürü bir araya getiren Yüksek Şuura topluluğu.</p><div className="sportActions"><Link href="/etkinlikler">Etkinlikleri Gör</Link><Link className="ghost" href="/">Dijital Şuura</Link></div></section>
  <section className="sportAbout"><div><span>HAKKIMIZDA</span><h2>Takım ruhu, dostluk ve ortak mücadele.</h2></div><p>Yüksek Şuura Spor Kulübü, Yüksek Şuura bünyesinde spor faaliyetlerini ve topluluk buluşmalarını bir araya getirir. Sahadaki rekabeti dostlukla, organizasyonu ortak hareket kültürüyle buluşturur.</p></section>
  <section className="sportGrid">
   <article><Trophy/><h2>Spor</h2><p>Halı saha ve farklı spor etkinlikleriyle aktif bir topluluk kültürü.</p></article>
   <article><Users/><h2>Topluluk</h2><p>Birlikte hareket eden, ortak anılar oluşturan Yüksek Şuura üyeleri.</p></article>
   <article><CalendarDays/><h2>Etkinlikler</h2><p>Planlanan buluşma ve organizasyonların Dijital Şuura üzerinden takibi.</p></article>
   <article><ShieldCheck/><h2>Kimlik</h2><p>Yüksek Şuura'nın kendine özgü spor, dostluk ve takım ruhu.</p></article>
  </section>
  <footer>YÜKSEK ŞUURA • SPOR KULÜBÜ • 2026</footer>
 </main>
}