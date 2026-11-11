import { brand, tierById } from "@/lib/brand";
import { sampleCourse } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export default async function HomePage() {
  const [viewer, sample] = await Promise.all([getViewer(), sampleCourse()]);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Paid school · adults 18+</p>
        <h1>{brand.tagline}</h1>
        <p className="lede">{brand.audience}</p>
        <div className="actions">
          {viewer ? <a className="button" href="/catalog">Open the catalog</a> : <a className="button" href="/signup">Create an account</a>}
          <a className="button secondary" href="/pricing">See the four paid levels</a>
        </div>
      </section>
      <section className="section-head">
        <h2>Four paid levels</h2>
        <p>There is no free campus. A higher level includes every course from the levels below it. Lesson text opens only while a subscription is active.</p>
      </section>
      <section className="tier-grid">
        {brand.tiers.map((tier) => (
          <article className="tier" key={tier.id}>
            <h3>{tier.name}</h3>
            <p className="price">{tier.monthly != null ? formatMoney(tier.monthly) : formatMoney(tier.annual)}</p>
            <p>{tier.monthly != null ? `${formatMoney(tier.annual)} a year, or ${formatMoney(tier.monthly)} a month.` : `${formatMoney(tier.annual)} a year.`}</p>
            <p>{tier.blurb}</p>
            {tier.note ? <p className="fine">{tier.note}</p> : null}
          </article>
        ))}
      </section>
      {sample ? (
        <section className="panel">
          <p className="badge">Sample course</p>
          <h2>{sample.title}</h2>
          <p>{sample.summary}</p>
          <p>Included with {tierById(brand.sampleCourse.minTier)?.name}. The lesson text stays closed until you have a paid plan.</p>
        </section>
      ) : null}
    </>
  );
}
