import { X } from "lucide-react";
import { useEffect, useRef } from "react";
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <header className="modal-head">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
export function Field({
  label,
  name,
  placeholder,
  required,
  area = false,
  value,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  area?: boolean;
  value?: string;
}) {
  return (
    <label className={`field ${area ? "field-area" : ""}`}>
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      {area ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={value}
        />
      ) : (
        <input
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={value}
        />
      )}
    </label>
  );
}
