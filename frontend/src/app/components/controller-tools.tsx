"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Notice = { kind: "success" | "error"; text: string };
type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Reaction = "LIKE" | "DISLIKE" | "FIRE" | "HEART" | "HEART_WITH_FIRE";

const reactions: { value: Reaction; label: string }[] = [
  { value: "LIKE", label: "👍 Подобається" },
  { value: "DISLIKE", label: "👎 Не подобається" },
  { value: "FIRE", label: "🔥 Вогонь" },
  { value: "HEART", label: "❤️ Серце" },
  { value: "HEART_WITH_FIRE", label: "❤️‍🔥 Серце у вогні" },
];

function responseMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(". ");
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = payload.error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

function positiveId(value: string, label: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`Вкажіть коректний додатний ID: ${label}.`);
  }
  return id;
}

export default function ControllerTools() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [chatId, setChatId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [memberRole, setMemberRole] = useState<"MODERATOR" | "MEMBER">("MODERATOR");
  const [publicChatId, setPublicChatId] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [members, setMembers] = useState<unknown[]>([]);
  const [allowedReactions, setAllowedReactions] = useState<Reaction[]>([
    "LIKE",
    "HEART",
    "FIRE",
  ]);
  const [blockedUsers, setBlockedUsers] = useState<unknown[]>([]);
  const [blockedId, setBlockedId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [restMessageText, setRestMessageText] = useState("");
  const [replyMessageId, setReplyMessageId] = useState("");
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const [selectedReaction, setSelectedReaction] = useState<Reaction>("LIKE");
  const [result, setResult] = useState<unknown>(null);
  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [avatarUserId, setAvatarUserId] = useState("");
  const [chatAvatarFile, setChatAvatarFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  async function request(
    key: string,
    path: string,
    method: Method,
    body?: Record<string, unknown> | FormData,
  ) {
    setBusy(key);
    setNotice(null);
    setResult(null);
    try {
      const isForm = body instanceof FormData;
      const response = await fetch(path, {
        method,
        ...(body
          ? {
              ...(isForm ? {} : { headers: { "Content-Type": "application/json" } }),
              body: isForm ? body : JSON.stringify(body),
            }
          : {}),
        cache: "no-store",
      });
      const raw = await response.text();
      let payload: unknown = null;
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = raw;
        }
      }
      if (!response.ok) {
        throw new Error(
          responseMessage(
            payload,
            `Запит завершився помилкою (${response.status}).`,
          ),
        );
      }
      setResult(payload);
      setNotice({
        kind: "success",
        text: response.status === 204 ? "Операцію виконано." : "Запит успішно виконано.",
      });
      return payload;
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося виконати запит до сервера.",
      });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function withChatId(key: string, operation: (id: number) => Promise<void>) {
    try {
      await operation(positiveId(chatId, "чату"));
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Некоректний ID чату.",
      });
    }
  }

  async function loadMembers() {
    await withChatId("members", async (id) => {
      const payload = await request(
        "members",
        `/api/chats/${id}/users?limit=50`,
        "GET",
      );
      if (payload === null) return;
      if (payload && typeof payload === "object" && "users" in payload && Array.isArray(payload.users)) {
        setMembers(payload.users);
        return;
      }
      throw new Error("Сервер повернув некоректний список учасників чату.");
    });
  }

  async function loadBlockedUsers() {
    const payload = await request("blocked", "/api/users/me/blocked", "GET");
    if (payload === null) return;
    if (Array.isArray(payload)) setBlockedUsers(payload);
    else if (payload && typeof payload === "object" && "users" in payload && Array.isArray(payload.users)) {
      setBlockedUsers(payload.users);
    } else {
      setNotice({ kind: "error", text: "Сервер повернув некоректний список заблокованих користувачів." });
    }
  }

  async function handleBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const id = positiveId(blockedId, "користувача");
      await request("block", `/api/users/block/${id}`, "POST");
      await loadBlockedUsers();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function memberAction(action: "remove" | "role") {
    try {
      const chat = positiveId(chatId, "чату");
      const member = positiveId(memberId, "користувача");
      const path =
        action === "role"
          ? `/api/chats/${chat}/users/${member}/role`
          : `/api/chats/${chat}/users/${member}`;
      const method = action === "remove" ? "DELETE" : "PATCH";
      await request(
        `member-${action}`,
        path,
        method,
        action === "role" ? { role: memberRole } : undefined,
      );
      await loadMembers();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректні ID." });
    }
  }

  async function chatCommand(
    action: "invite" | "owner" | "pin" | "unpin" | "reactions" | "delete" | "clearMessages",
  ) {
    await withChatId(`chat-${action}`, async (id) => {
      if (action === "delete" && !window.confirm("Видалити цей чат? Цю дію не можна скасувати.")) return;
      if (action === "clearMessages" && !window.confirm("Видалити всі повідомлення цього чату?")) return;
      if (action === "owner") {
        const owner = positiveId(ownerId, "нового власника");
        await request("chat-owner", `/api/chats/${id}/owner/${owner}`, "PATCH");
      } else if (action === "invite") {
        await request("chat-invite", `/api/chats/${id}/invite-token`, "PATCH");
      } else if (action === "pin" || action === "unpin") {
        await request(`chat-${action}`, `/api/chats/${id}/${action}`, "PATCH");
      } else if (action === "reactions") {
        await request("chat-reactions", `/api/chats/${id}/allowed-reactions`, "PATCH", {
          allowedReactions,
        });
      } else if (action === "delete") {
        await request("chat-delete", `/api/chats/${id}`, "DELETE");
      } else {
        await request("clear-messages", `/api/chats/${id}/messages`, "DELETE");
      }
    });
  }

  async function joinByInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteToken.trim()) {
      setNotice({ kind: "error", text: "Введіть токен запрошення." });
      return;
    }
    await request(
      "join",
      `/api/chats/invite/${encodeURIComponent(inviteToken.trim())}`,
      "POST",
    );
  }

  async function joinPublicChat() {
    try {
      const id = positiveId(publicChatId, "публічного чату");
      await request("join-public", `/api/chats/join/${id}`, "POST");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function messageCommand(
    action: "get" | "update" | "delete" | "pin" | "unpin",
  ) {
    try {
      const id = positiveId(messageId, "повідомлення");
      if (action === "delete" && !window.confirm("Видалити повідомлення?")) return;
      const method = action === "get" ? "GET" : action === "update" || action === "pin" || action === "unpin" ? "PATCH" : "DELETE";
      const suffix = action === "get" || action === "update" || action === "delete" ? "" : `/${action}`;
      await request(
        `message-${action}`,
        `/api/controller-api/messages/${id}${suffix}`,
        method,
        action === "update" ? { text: messageText } : undefined,
      );
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function createRestMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const id = positiveId(chatId, "чату");
      const text = restMessageText.trim();
      if (!text) throw new Error("Введіть текст повідомлення.");
      if (messageFiles.length > 5) {
        throw new Error("Можна прикріпити не більше 5 файлів.");
      }
      const form = new FormData();
      if (text) form.append("text", text);
      if (replyMessageId.trim()) {
        form.append("replyId", String(positiveId(replyMessageId, "повідомлення-відповіді")));
      }
      messageFiles.forEach((file) => form.append("files", file));
      await request("rest-message-create", `/api/chats/${id}/messages`, "POST", form);
      setRestMessageText("");
      setReplyMessageId("");
      setMessageFiles([]);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Не вдалося створити повідомлення." });
    }
  }

  async function reactionCommand(action: "POST" | "PATCH" | "DELETE") {
    try {
      const id = positiveId(messageId, "повідомлення");
      await request(
        `reaction-${action}`,
        `/api/controller-api/messages/${id}/reactions`,
        action,
        action === "DELETE" ? undefined : { reaction: selectedReaction },
      );
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function uploadAvatar(kind: "user" | "chat") {
    const file = kind === "user" ? userAvatarFile : chatAvatarFile;
    if (!file) {
      setNotice({ kind: "error", text: "Оберіть файл зображення." });
      return;
    }
    const form = new FormData();
    form.append("avatar", file);
    try {
      const path =
        kind === "user"
          ? "/api/users/me/avatar"
          : `/api/chats/${positiveId(chatId, "чату")}/avatar`;
      await request(`${kind}-avatar`, path, "PATCH", form);
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function deleteAvatar(kind: "user" | "chat") {
    try {
      const path =
        kind === "user"
          ? "/api/users/me/avatar"
          : `/api/chats/${positiveId(chatId, "чату")}/avatar`;
      await request(`${kind}-avatar-delete`, path, "DELETE");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function deleteUserAvatar() {
    try {
      const id = positiveId(avatarUserId, "користувача");
      await request(`user-avatar-${id}`, `/api/users/${id}/avatar`, "DELETE");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Некоректний ID." });
    }
  }

  async function uploadAttachments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFiles.length) {
      setNotice({ kind: "error", text: "Оберіть один або кілька файлів." });
      return;
    }
    const form = new FormData();
    uploadFiles.slice(0, 5).forEach((file) => form.append("files", file));
    await request("files-upload", "/api/controller-api/files/upload", "POST", form);
  }

  function renderJson(value: unknown) {
    if (value === null) return null;
    return <pre className="controller-result">{JSON.stringify(value, null, 2)}</pre>;
  }

  return (
    <main className="shell controller-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="100gram — до чатів">
          <span className="brand-mark">1</span><span>100gram</span>
        </Link>
        <nav className="controller-nav" aria-label="Навігація">
          <Link className="docs-link" href="/">Чати</Link>
          <Link className="docs-link" href="/user">Профіль</Link>
        </nav>
      </header>
      <section className="user-page-intro">
        <div className="eyebrow"><span className="live-dot" /> API CONTROL CENTER</div>
        <h1>Керування сервісом</h1>
        <p>Інтерфейс для операцій наявних контролерів. Доступність дій залежить від ролі та прав акаунта.</p>
      </section>
      {notice && (
        <div className={`notice notice-${notice.kind} controller-notice`} role={notice.kind === "error" ? "alert" : "status"}>
          <span className="notice-symbol" aria-hidden="true">{notice.kind === "success" ? "✓" : "!"}</span>
          {notice.text}
          <button className="notice-close" type="button" aria-label="Закрити" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <section className="controller-section">
        <div className="section-heading"><div><div className="eyebrow">CHAT CONTROLLER</div><h2>Керування чатами</h2></div></div>
        <div className="controller-grid">
          <article className="controller-card">
            <h3>Чат і учасники</h3>
            <label>ID чату<input inputMode="numeric" value={chatId} onChange={(event) => setChatId(event.target.value)} placeholder="Наприклад, 12" /></label>
            <label>ID учасника<input inputMode="numeric" value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="ID користувача" /></label>
            <div className="controller-actions">
              <button type="button" className="button button-soft" disabled={busy !== null} onClick={() => void loadMembers()}>Завантажити учасників</button>
              <button type="button" className="button button-quiet" disabled={busy !== null} onClick={() => void memberAction("remove")}>Видалити</button>
            </div>
            <label>Нова роль учасника
              <select aria-label="Нова роль учасника" value={memberRole} onChange={(event) => setMemberRole(event.target.value as "MODERATOR" | "MEMBER")}>
                <option value="MODERATOR">MODERATOR</option>
                <option value="MEMBER">MEMBER</option>
              </select>
            </label>
            <button type="button" className="button button-soft" disabled={busy !== null} onClick={() => void memberAction("role")}>Оновити роль</button>
            <p className="controller-warning">Додавання учасника приховано до виправлення backend-перевірки прав доступу.</p>
            {members.length > 0 && <ul className="controller-list">{members.map((member, index) => <li key={index}>{typeof member === "object" && member !== null && "nickname" in member ? String(member.nickname) : JSON.stringify(member)}</li>)}</ul>}
          </article>
          <article className="controller-card">
            <h3>Власник, запрошення й налаштування</h3>
            <label>ID нового власника<input inputMode="numeric" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} /></label>
            <div className="controller-actions">
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void chatCommand("owner")}>Передати власника</button>
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void chatCommand("invite")}>Оновити токен запрошення</button>
            </div>
            <label>Дозволені реакції</label>
            <div className="controller-checkboxes">{reactions.map((reaction) => <label key={reaction.value}><input type="checkbox" checked={allowedReactions.includes(reaction.value)} onChange={(event) => setAllowedReactions((current) => event.target.checked ? [...current, reaction.value] : current.filter((item) => item !== reaction.value))} />{reaction.label}</label>)}</div>
            <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void chatCommand("reactions")}>Зберегти реакції чату</button>
            <div className="controller-actions">
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void chatCommand("pin")}>Закріпити чат</button>
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void chatCommand("unpin")}>Відкріпити</button>
            </div>
            <div className="controller-actions">
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void chatCommand("clearMessages")}>Очистити повідомлення</button>
              <button className="button button-danger" type="button" disabled={busy !== null} onClick={() => void chatCommand("delete")}>Видалити чат</button>
            </div>
          </article>
          <article className="controller-card">
            <h3>Приєднатися за запрошенням</h3>
            <form className="controller-form" onSubmit={(event) => void joinByInvite(event)}>
              <label>Токен запрошення<input value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} required /></label>
              <button className="button button-primary" type="submit" disabled={busy !== null}>Приєднатися до групи</button>
            </form>
            <label>ID публічного чату<input inputMode="numeric" value={publicChatId} onChange={(event) => setPublicChatId(event.target.value)} /></label>
            <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void joinPublicChat()}>Приєднатися до публічного чату</button>
          </article>
        </div>
      </section>

      <section className="controller-section">
        <div className="section-heading"><div><div className="eyebrow">MESSAGE CONTROLLER</div><h2>Повідомлення та реакції</h2></div></div>
        <div className="controller-grid">
          <article className="controller-card">
            <h3>REST створення повідомлення</h3>
            <p>Використовує ID чату з розділу «Керування чатами».</p>
            <form className="controller-form" onSubmit={(event) => void createRestMessage(event)}>
              <label>Текст<input maxLength={3000} value={restMessageText} onChange={(event) => setRestMessageText(event.target.value)} required /></label>
              <label>ID повідомлення для відповіді (необов’язково)<input inputMode="numeric" value={replyMessageId} onChange={(event) => setReplyMessageId(event.target.value)} /></label>
              <label>Вкладення (до 5)<input type="file" multiple onChange={(event) => setMessageFiles(Array.from(event.target.files ?? []))} /></label>
              <button className="button button-primary" type="submit" disabled={busy !== null}>Надіслати через REST</button>
            </form>
          </article>
          <article className="controller-card">
            <h3>Операції з повідомленням</h3>
            <label>ID повідомлення<input inputMode="numeric" value={messageId} onChange={(event) => setMessageId(event.target.value)} /></label>
            <label>Новий текст<input maxLength={3000} value={messageText} onChange={(event) => setMessageText(event.target.value)} /></label>
            <div className="controller-actions">
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void messageCommand("get")}>Отримати</button>
              <button className="button button-soft" type="button" disabled={busy !== null || !messageText.trim()} onClick={() => void messageCommand("update")}>Оновити текст</button>
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void messageCommand("pin")}>Закріпити</button>
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void messageCommand("unpin")}>Відкріпити</button>
              <button className="button button-danger" type="button" disabled={busy !== null} onClick={() => void messageCommand("delete")}>Видалити</button>
            </div>
          </article>
          <article className="controller-card">
            <h3>REST реакції</h3>
            <label>Реакція<select value={selectedReaction} onChange={(event) => setSelectedReaction(event.target.value as Reaction)}>{reactions.map((reaction) => <option key={reaction.value} value={reaction.value}>{reaction.label}</option>)}</select></label>
            <div className="controller-actions">
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void reactionCommand("POST")}>Додати</button>
              <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void reactionCommand("PATCH")}>Оновити</button>
              <button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void reactionCommand("DELETE")}>Видалити</button>
            </div>
          </article>
        </div>
      </section>

      <section className="controller-section">
        <div className="section-heading"><div><div className="eyebrow">USER CONTROLLERS</div><h2>Блокування й аватари</h2></div></div>
        <div className="controller-grid">
          <article className="controller-card">
            <h3>Заблоковані користувачі</h3>
            <form className="controller-form" onSubmit={(event) => void handleBlock(event)}>
              <label>ID користувача<input inputMode="numeric" value={blockedId} onChange={(event) => setBlockedId(event.target.value)} required /></label>
              <button className="button button-primary" type="submit" disabled={busy !== null}>Заблокувати</button>
            </form>
            <button className="button button-soft" type="button" disabled={busy !== null} onClick={() => void loadBlockedUsers()}>Оновити список</button>
            <ul className="controller-list">{blockedUsers.map((user, index) => {
              const id = user && typeof user === "object" && "blockedId" in user ? String(user.blockedId) : "";
              const name = user && typeof user === "object" && "nickname" in user ? String(user.nickname) : `Користувач ${id}`;
              return <li key={index}><span>{name} {id ? `(ID ${id})` : ""}</span>{id && <button className="text-button" type="button" disabled={busy !== null} onClick={() => void request(`unblock-${id}`, `/api/users/block/${id}`, "DELETE")}>Розблокувати</button>}</li>;
            })}</ul>
          </article>
          <article className="controller-card">
            <h3>Мій аватар</h3>
            <label>Зображення (PNG, JPG, SVG; до 7 МБ)<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={(event) => setUserAvatarFile(event.target.files?.[0] ?? null)} /></label>
            <div className="controller-actions"><button className="button button-primary" type="button" disabled={busy !== null || !userAvatarFile} onClick={() => void uploadAvatar("user")}>Завантажити</button><button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void deleteAvatar("user")}>Видалити аватар</button></div>
            <label>ID користувача (лише для адміністратора)<input inputMode="numeric" value={avatarUserId} onChange={(event) => setAvatarUserId(event.target.value)} /></label>
            <button className="button button-quiet" type="button" disabled={busy !== null || !avatarUserId} onClick={() => void deleteUserAvatar()}>Видалити аватар іншого користувача</button>
          </article>
          <article className="controller-card">
            <h3>Аватар чату</h3>
            <p>Використовує ID чату з першого розділу; backend приймає зображення до 7 МБ.</p>
            <label>Зображення<input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml" onChange={(event) => setChatAvatarFile(event.target.files?.[0] ?? null)} /></label>
            <div className="controller-actions"><button className="button button-primary" type="button" disabled={busy !== null || !chatAvatarFile} onClick={() => void uploadAvatar("chat")}>Завантажити</button><button className="button button-quiet" type="button" disabled={busy !== null} onClick={() => void deleteAvatar("chat")}>Видалити аватар</button></div>
          </article>
        </div>
      </section>

      <section className="controller-section">
        <div className="section-heading"><div><div className="eyebrow">FILE CONTROLLER</div><h2>Файли</h2></div></div>
        <article className="controller-card controller-file-card">
          <h3>Завантажити вкладення</h3>
          <p>Можна вибрати до 5 файлів за один запит.</p>
          <form className="controller-form" onSubmit={(event) => void uploadAttachments(event)}>
            <label>Файли<input type="file" multiple onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))} /></label>
            <button className="button button-primary" type="submit" disabled={busy !== null || !uploadFiles.length}>Завантажити файли</button>
          </form>
        </article>
      </section>

      {result !== null && (
        <section className="controller-section">
          <div className="section-heading"><div><div className="eyebrow">API RESPONSE</div><h2>Результат останнього запиту</h2></div></div>
          {renderJson(result)}
        </section>
      )}
      <footer className="footer"><Link className="brand footer-brand" href="/"><span className="brand-mark">1</span><span>100gram</span></Link><span>Операції відповідають наявним backend endpoints.</span></footer>
    </main>
  );
}
