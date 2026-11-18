import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password field with an eye button to show/hide what was typed; all other props go to the <input>
export default function PasswordInput({ className = '', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? 'text' : 'password'} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 px-3.5 flex items-center text-amber-300/70 hover:text-amber-200 cursor-pointer"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
