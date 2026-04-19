// Static legal/practice corpus used by the cite_law tool.
//
// This is intentionally tiny and ships in the bundle so the swarm can cite
// well-known statutory text *without* making any external network calls.
// It is NOT a substitute for legal advice and is referenced as such by agents.
//
// Sources are public domain UK legislation summaries; expand carefully.

export interface LegalEntry {
  topic: string
  citation: string
  summary: string
}

const CORPUS: LegalEntry[] = [
  {
    topic: 'duty to assess',
    citation: 'Children and Families Act 2014, s.36(8)',
    summary:
      'A local authority must conduct an EHC needs assessment if the child or young person has, or may have, special educational needs and it may be necessary for special educational provision to be made via an EHC plan.',
  },
  {
    topic: 'specified and quantified provision',
    citation: 'SEND Code of Practice 2015, paragraphs 9.69 and 9.62',
    summary:
      'Section F provision must be detailed, specific and normally quantified (e.g. type, hours, frequency of support, type of expertise of staff). Vague wording such as "access to" or "as appropriate" is non-compliant.',
  },
  {
    topic: 'statutory timelines',
    citation: 'SEND Regulations 2014, reg. 13 and Code of Practice 9.42',
    summary:
      "The whole EHC needs assessment and plan-issuing process must take no more than 20 weeks from the point an assessment is requested or the child is brought to the LA's attention.",
  },
  {
    topic: 'right of appeal',
    citation: 'Children and Families Act 2014, s.51',
    summary:
      'Parents and young people have a right of appeal to the First-tier Tribunal (SEND) against (among other things) refusal to assess, refusal to issue a plan, and the contents of sections B, F and I of a finalised plan.',
  },
  {
    topic: 'mediation',
    citation: 'Children and Families Act 2014, s.55',
    summary:
      'Before registering most appeals, parents must contact a mediation adviser. Mediation itself is optional, but obtaining a mediation certificate is generally required to appeal.',
  },
  {
    topic: 'parental request for assessment',
    citation: 'Children and Families Act 2014, s.36(1)',
    summary:
      'A parent or young person has the right to request an EHC needs assessment. The LA must respond within 6 weeks confirming whether it will assess.',
  },
  {
    topic: 'school placement (section I)',
    citation: 'Children and Families Act 2014, s.39',
    summary:
      'Once a draft plan is issued, parents have 15 calendar days to request a particular school. The LA must name that school unless it is unsuitable, incompatible with efficient education of others, or incompatible with efficient use of resources.',
  },
  {
    topic: 'annual review',
    citation: 'SEND Regulations 2014, reg. 18-22',
    summary:
      'EHC plans must be reviewed at least every 12 months. The LA must notify the parent of its decision (to maintain, amend, or cease) within 4 weeks of the review meeting.',
  },
]

/**
 * Look up corpus entries relevant to a free-text topic. Simple keyword match
 * is sufficient at this scale and avoids any external dependency.
 */
export function lookupLaw(topic: string, limit = 3): LegalEntry[] {
  const q = topic.toLowerCase()
  const scored = CORPUS.map(entry => {
    const hay = `${entry.topic} ${entry.summary} ${entry.citation}`.toLowerCase()
    let score = 0
    for (const word of q.split(/\W+/).filter(w => w.length > 2)) {
      if (hay.includes(word)) score += 1
    }
    return { entry, score }
  })
  scored.sort((a, b) => b.score - a.score)
  const hits = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.entry)
  return hits.length > 0 ? hits : CORPUS.slice(0, limit)
}
