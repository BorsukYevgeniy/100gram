type UserAdminCardProps = {
  busy: string | null;
  hasTargetUserId: boolean;
  onAssignAdmin: () => void;
  onDeleteUser: () => void;
};

export default function UserAdminCard({
  busy,
  hasTargetUserId,
  onAssignAdmin,
  onDeleteUser,
}: UserAdminCardProps) {
  return (
    <article className="tool-card user-tool-card">
      <div className="tool-icon icon-orange">03</div>
      <h3>Адміністрування</h3>
      <p>Призначте роль адміністратора або видаліть користувача за ID.</p>
      <div className="button-row">
        <button
          className="button button-soft"
          type="button"
          disabled={busy !== null || !hasTargetUserId}
          onClick={onAssignAdmin}
        >
          {busy === "assign-admin" ? "Призначення…" : "Призначити адміна"}
        </button>
        <button
          className="button button-danger"
          type="button"
          disabled={busy !== null || !hasTargetUserId}
          onClick={onDeleteUser}
        >
          {busy === "delete-user" ? "Видалення…" : "Видалити"}
        </button>
      </div>
    </article>
  );
}
