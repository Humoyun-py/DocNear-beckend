import React from 'react';

// Model output is untrusted text. React escapes it before rendering.
export function BoldText({ text }: { text: string }) {
  return <>{text.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>
      : part
  )}</>;
}
