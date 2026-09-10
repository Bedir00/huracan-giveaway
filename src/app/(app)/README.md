# Hinweis: kein `loading.tsx` in dieser Route-Gruppe

Ein `loading.tsx` auf Ebene dieser Route-Gruppe legt eine Suspense-Grenze um
**jede** Seite des angemeldeten Bereichs. In Kombination mit Server Actions, die
`revalidatePath` aufrufen und deren Ergebnis über `useActionState` gelesen wird,
führt das dazu, dass die Transition nie committet: Der Schreibvorgang läuft
durch, das Formular bleibt aber dauerhaft im Zustand „Speichern…“ und
Dialoge schließen sich nicht mehr.

Deshalb bitte **kein** `loading.tsx` hier anlegen. Wenn eine Seite spürbar lange
lädt, stattdessen ein gezieltes `<Suspense>` **innerhalb** der Seite um den
langsamen Abschnitt legen - so wie im Dashboard um die Kennzahlen-Blöcke, die
selbst keine Formulare mit `useActionState` enthalten.
