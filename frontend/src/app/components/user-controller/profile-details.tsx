import type { UserProfile } from "./types";

export default function ProfileDetails({
  profile,
}: {
  profile: UserProfile;
}) {
  return (
    <dl className="profile-details">
      <div>
        <dt>ID</dt>
        <dd>{profile.id}</dd>
      </div>
      <div>
        <dt>Нікнейм</dt>
        <dd>{profile.nickname}</dd>
      </div>
      <div>
        <dt>Роль</dt>
        <dd>{profile.role === "ADMIN" ? "Адміністратор" : "Користувач"}</dd>
      </div>
      <div>
        <dt>Статус</dt>
        <dd>{profile.isVerified ? "Підтверджено" : "Не підтверджено"}</dd>
      </div>
      <div>
        <dt>Створено</dt>
        <dd>{new Date(profile.createdAt).toLocaleDateString("uk-UA")}</dd>
      </div>
      {profile.description && (
        <div>
          <dt>Опис</dt>
          <dd>{profile.description}</dd>
        </div>
      )}
    </dl>
  );
}
