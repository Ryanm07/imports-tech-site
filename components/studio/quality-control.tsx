"use client";

import { useId } from "react";
import {
  QUALITY_LABELS,
  readStudioQualityPreference,
  type StudioQuality,
  type StudioQualityPreference,
} from "@/lib/studio-quality";
import styles from "./quality-control.module.css";

type QualityControlProps = {
  quality: StudioQuality;
  preference: StudioQualityPreference;
  onPreferenceChange: (preference: StudioQualityPreference) => void;
  evaluating?: boolean;
  compact?: boolean;
};

export function QualityControl({
  quality,
  preference,
  onPreferenceChange,
  evaluating = false,
  compact = false,
}: QualityControlProps) {
  const id = useId();
  const status =
    preference === "auto"
      ? `Em uso: ${QUALITY_LABELS[quality]}. Ajuste automático conforme a fluidez.`
      : `Em uso: ${QUALITY_LABELS[quality]}. Sua escolha fica salva neste navegador.`;

  return (
    <div className={`${styles.control} ${compact ? styles.compact : ""}`}>
      <label htmlFor={id}>Qualidade</label>
      <select
        id={id}
        value={preference}
        aria-describedby={`${id}-status`}
        onChange={(event) =>
          onPreferenceChange(readStudioQualityPreference(event.target.value))
        }
      >
        <option value="auto">
          {compact ? `Auto · ${QUALITY_LABELS[quality]}` : "Automática"}
        </option>
        <option value="basic">Máxima economia</option>
        <option value="low">Leve</option>
        <option value="medium">Equilibrada</option>
        <option value="high">Alta</option>
        <option value="ultra">Cinemática</option>
      </select>
      <p
        id={`${id}-status`}
        className={compact ? styles.visuallyHidden : undefined}
      >
        {status}
        {evaluating && preference === "auto"
          ? " Avaliando o modo cinematográfico."
          : ""}
      </p>
      {!compact && (
        <p>
          Máxima economia simplifica o cenário e as interações. Cinemática
          acrescenta plasma, fragmentos e partículas douradas.
        </p>
      )}
    </div>
  );
}
