import type { ElementType, ReactNode } from "react";

type ScrollSectionProps = {
  as?: ElementType;
  id?: string;
  name: string;
  className?: string;
  children: ReactNode;
};

export function ScrollSection({
  as: Tag = "section",
  id,
  name,
  className,
  children,
}: ScrollSectionProps) {
  return (
    <Tag
      id={id}
      className={className}
      data-motion-section={name}
      data-section-progress="0"
    >
      <span className="section-signal-thread" aria-hidden="true" />
      {children}
    </Tag>
  );
}
