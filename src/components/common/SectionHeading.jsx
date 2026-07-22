export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="relative">
        <div className="absolute -inset-x-3 -inset-y-2 -z-10 rounded-2xl backdrop-blur-[2px]" aria-hidden="true" />
        {eyebrow && <p className="section-eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold text-mist-50 sm:text-3xl">{title}</h2>
        {description && <p className="mt-1.5 max-w-xl text-sm text-slate-300">{description}</p>}
      </div>
      {action}
    </div>
  );
}
