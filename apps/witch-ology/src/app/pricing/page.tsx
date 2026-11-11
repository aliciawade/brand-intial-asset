import type { Metadata } from "next";
import { brand, tierById } from "@/lib/brand";
import { sampleCourse } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const [viewer, sample] = await Promise.all([getViewer(), sampleCourse()]);
  return (
    <section className="stack">
      <div className="section-head">
        <p className="eyebrow">{brand.communityName}</p>
        <h1>Every level is paid</h1>
        <p>Welcome is the entry subscription, not a free preview. Member Circle includes Welcome. Inner Circle includes both. Founder's Crown includes the full catalog.</p>
      </div>
      <div className="tier-grid">
        {brand.tiers.map((tier) => (
          <article className="tier" key={tier.id}>
            <h2>{tier.name}</h2>
            <p className="price">
              {tier.monthly != null ? `${formatMoney(tier.monthly)} / month` : `${formatMoney(tier.annual)} / year`}
            </p>
            <p>{tier.monthly != null ? `${formatMoney(tier.annual)} / year` : "Billed once a year."}</p>
            <p>{tier.blurb}</p>
            {tier.note ? <p>{tier.note}</p> : null}
          </article>
        ))}
      </div>
      {sample ? (
        <p>The current sample, “{sample.title},” is included with {tierById(brand.sampleCourse.minTier)?.name} and every level above it.</p>
      ) : null}
      <div className="actions">
        {viewer ? <a className="button" href="/billing">Continue to billing</a> : <a className="button" href="/signup?next=/billing">Create an account to subscribe</a>}
      </div>
    </section>
  );
}
