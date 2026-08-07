import React from "react";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { palette, colors, radius, shadow } from "@/theme/tokens";
import { useTasks, useToggleTaskStatus } from "../../automation/useTasks";

const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export function TasksWidget() {
  const { data: tasks, isLoading } = useTasks();
  const toggleStatus = useToggleTaskStatus();

  if (isLoading) return null;

  const pending = (tasks || []).filter((t) => t.status === "pending");
  const done = (tasks || []).filter((t) => t.status === "done");

  function handleToggle(task) {
    toggleStatus.mutate({ id: task.id, status: task.status === "pending" ? "done" : "pending" });
  }

  return (
    <div style={{ background: colors.white, borderRadius: radius.lg, padding: 20, boxShadow: shadow.card,
      border: "1px solid " + colors.gray[100] }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <ClipboardList size={16} color={palette.primary.solid} />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.gray[900] }}>Taches</p>
        {pending.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, padding: "2px 8px",
            borderRadius: radius.full, background: palette.primary[50], color: palette.primary.solid }}>
            {pending.length + " en attente"}
          </span>
        )}
      </div>

      {(!tasks || tasks.length === 0) ? (
        <p style={{ fontSize: 13, color: colors.gray[600], padding: "16px 0", textAlign: "center" }}>
          Aucune tache pour le moment. Les taches creees par vos regles d'automatisation apparaitront ici.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {pending.map((t) => (
            <button key={t.id} onClick={() => handleToggle(t)} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
              borderBottom: "1px solid " + colors.gray[100], border: "none", borderBottomWidth: 1,
              background: "none", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: font }}>
              <Circle size={16} color={colors.gray[400]} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900] }}>{t.title}</p>
                {t.description && (
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.gray[600] }}>{t.description}</p>
                )}
              </div>
            </button>
          ))}
          {done.slice(0, 3).map((t) => (
            <button key={t.id} onClick={() => handleToggle(t)} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
              borderBottom: "1px solid " + colors.gray[100], border: "none", borderBottomWidth: 1,
              background: "none", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: font, opacity: 0.5 }}>
              <CheckCircle2 size={16} color={palette.green.solid} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: colors.gray[900], textDecoration: "line-through" }}>{t.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}