import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

export function MissionReview({ missions, onlyWrong }: { missions: any[]; onlyWrong?: boolean }) {
  return (
    <div className="mt-3 space-y-5">
      {missions.map((m: any) => {
        const rows = onlyWrong ? m.rows.filter((x: any) => x.result !== "correct") : m.rows;
        return (
          <div key={m.key} className="soc-card p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{m.title}</h3><span className="text-sm">{m.score}/{m.max}</span></div>
            {m.incident && (
              <div className="mt-2 rounded-md bg-muted p-3 text-xs">
                <div className="font-semibold">{m.incident.title}</div><div>{m.incident.situation}</div>
                <div className="mt-1 font-mono">{m.incident.notification}</div>
                <ul className="mt-1 list-disc pl-4">{m.incident.clues.map((c: string) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
            {rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No incorrect decisions in this mission.</p>}
            <ul className="mt-3 divide-y divide-border">
              {rows.map((x: any, i: number) => (
                <li key={i} className="py-3 text-sm">
                  <div className="flex items-start gap-2">
                    {x.result === "correct" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : x.result === "incorrect" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="flex-1">
                      <div className="font-medium">{x.item}</div>
                      <div className="mt-1 grid gap-x-4 text-xs text-muted-foreground sm:grid-cols-3">
                        <span>Your choice: <b className="text-foreground">{x.selection}</b></span>
                        <span>Recommended: <b className="text-foreground">{x.correct}</b></span>
                        <span>Points: <b className="text-foreground">{x.points > 0 ? `+${x.points}` : x.points}</b></span>
                      </div>
                      <p className="mt-1 text-xs">{x.explanation}</p>
                      {x.tip && <p className="mt-0.5 text-xs text-primary">Best practice: {x.tip}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

