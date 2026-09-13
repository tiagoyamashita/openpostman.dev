import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";

export type PromptField = {
  id: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
};

type ConfirmRequest = {
  type: "confirm";
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

type PromptRequest = {
  type: "prompt";
  title: string;
  message?: string;
  fields: PromptField[];
  confirmLabel?: string;
  resolve: (values: Record<string, string> | null) => void;
};

type DialogRequest = ConfirmRequest | PromptRequest;

function finish(request: DialogRequest, ok: boolean, values?: Record<string, string>): void {
  switch (request.type) {
    case "confirm":
      request.resolve(ok);
      return;
    case "prompt":
      request.resolve(ok && values ? values : null);
      return;
    default: {
      const _exhaustive: never = request;
      throw new Error(`Unhandled dialog: ${_exhaustive}`);
    }
  }
}

export function useAppDialog() {
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const confirm = useCallback(
    (opts: {
      title: string;
      message: string;
      confirmLabel?: string;
      danger?: boolean;
    }): Promise<boolean> => {
      return new Promise((resolve) => {
        setRequest({
          type: "confirm",
          ...opts,
          resolve: (ok) => {
            setRequest(null);
            resolve(ok);
          },
        });
      });
    },
    [],
  );

  const prompt = useCallback(
    (opts: {
      title: string;
      message?: string;
      fields: PromptField[];
      confirmLabel?: string;
    }): Promise<Record<string, string> | null> => {
      return new Promise((resolve) => {
        setRequest({
          type: "prompt",
          ...opts,
          resolve: (values) => {
            setRequest(null);
            resolve(values);
          },
        });
      });
    },
    [],
  );

  const dialog = <AppDialog request={request} />;
  return { confirm, prompt, dialog };
}

function AppDialog({ request }: { request: DialogRequest | null }) {
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!request) return;
    if (request.type === "prompt") {
      const next: Record<string, string> = {};
      for (const field of request.fields) {
        next[field.id] = field.defaultValue ?? "";
      }
      setValues(next);
    }
    const frame = window.requestAnimationFrame(() => {
      (firstField.current ?? confirmBtn.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const open = request;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(open, false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request]);

  if (!request) return null;
  const open = request;

  function cancel() {
    finish(open, false);
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (open.type === "confirm") {
      finish(open, true);
      return;
    }
    finish(open, true, values);
  }

  const confirmLabel =
    open.confirmLabel ?? (open.type === "confirm" ? "OK" : "Save");
  const confirmClass =
    open.type === "confirm" && open.danger ? "btn btn-danger" : "btn btn-primary";

  return (
    <div className="modal-backdrop" role="presentation" onClick={cancel}>
      <div
        className="modal modal-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="modal-header">
            <h2 id={titleId}>{open.title}</h2>
            <button className="btn" type="button" onClick={cancel}>
              Close
            </button>
          </div>
          {open.type === "confirm" ? (
            <p className="muted modal-lead">{open.message}</p>
          ) : (
            <>
              {open.message ? <p className="muted modal-lead">{open.message}</p> : null}
              <div className="modal-body">
                {open.fields.map((field, index) => (
                  <label className="modal-field" key={field.id}>
                    <span>{field.label}</span>
                    <input
                      ref={index === 0 ? firstField : undefined}
                      value={values[field.id] ?? ""}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setValues((current) => ({ ...current, [field.id]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="modal-footer">
            <button className="btn" type="button" onClick={cancel}>
              Cancel
            </button>
            <button className={confirmClass} type="submit" ref={confirmBtn}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
