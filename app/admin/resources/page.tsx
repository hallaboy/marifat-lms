"use client";

import { ArrowLeft, BookOpen, Books, CheckCircle, FileArrowUp, FileText, LinkSimple, Plus, RocketLaunch, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { API_ORIGIN, apiFetch, AuthUser, LibraryResource, LibraryResourceType, readCsrfCookie, ResourceGroup } from "../../_lib/api";
import styles from "./styles.module.css";

const typeNames: Record<LibraryResourceType, string> = { textbook: "Darslik", methodology: "Metodik qo‘llanma", recommendation: "Tavsiya", presentation: "Taqdimot", other: "Boshqa" };
const emptyGroup = { name: "", slug: "", direction: "", description: "" };
const emptyResource = { title: "", description: "", resource_type: "textbook" as LibraryResourceType, display_order: 1 };
const fileUrl = (url: string) => url.startsWith("/") ? `${API_ORIGIN}${url}` : url;

function slugify(value: string) {
  return value.toLocaleLowerCase("uz").normalize("NFKD").replace(/[ʻ’‘']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 180);
}

export default function AdminResourcesPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [selected, setSelected] = useState<ResourceGroup | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [externalUrl, setExternalUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh(preferredId?: string) {
    const response = await apiFetch("/api/v1/admin/resource-groups");
    if (!response.ok) throw new Error("Resurs guruhlarini yuklab bo‘lmadi");
    const data = (await response.json()) as ResourceGroup[];
    setGroups(data);
    const targetId = preferredId ?? selected?.id;
    if (targetId) setSelected(data.find((group) => group.id === targetId) ?? null);
  }

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        const profile = (await profileResponse.json()) as AuthUser;
        if (profile.role !== "admin" && profile.role !== "super_admin") return router.replace("/resources");
        const response = await apiFetch("/api/v1/admin/resource-groups");
        if (!response.ok) throw new Error("Resurs guruhlarini yuklab bo‘lmadi");
        setGroups((await response.json()) as ResourceGroup[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  function csrf() {
    const token = readCsrfCookie();
    if (!token) setError("Sessiya himoya tokeni topilmadi. Qayta kiring.");
    return token;
  }

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch("/api/v1/admin/resource-groups", { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify(groupForm) });
    const data = (await response.json().catch(() => ({}))) as ResourceGroup & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Guruhni yaratib bo‘lmadi");
    setGroupForm(emptyGroup); setShowGroupForm(false); setSelected(data); setMessage("Resurs guruhi yaratildi.");
    await refresh(data.id);
  }

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); if (!selected) return; const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/resource-groups/${selected.id}/resources/link`, { method: "POST", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ ...resourceForm, external_url: externalUrl }) });
    const data = (await response.json().catch(() => ({}))) as LibraryResource & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Havolani qo‘shib bo‘lmadi");
    const nextOrder = resourceForm.display_order + 1; setResourceForm({ ...emptyResource, display_order: nextOrder }); setExternalUrl(""); setMessage("Tashqi resurs qo‘shildi.");
    await refresh(selected.id);
  }

  async function addFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); if (!selected || !uploadFile) return setError("Faylni tanlang."); const token = csrf(); if (!token) return;
    const body = new FormData(); body.set("title", resourceForm.title); body.set("description", resourceForm.description); body.set("resource_type", resourceForm.resource_type); body.set("display_order", String(resourceForm.display_order)); body.set("file", uploadFile);
    const response = await apiFetch(`/api/v1/admin/resource-groups/${selected.id}/resources/upload`, { method: "POST", headers: { "X-CSRF-Token": token }, body });
    const data = (await response.json().catch(() => ({}))) as LibraryResource & { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Faylni yuklab bo‘lmadi");
    const nextOrder = resourceForm.display_order + 1; setResourceForm({ ...emptyResource, display_order: nextOrder }); setUploadFile(null); setMessage("Elektron resurs xavfsiz saqlandi.");
    await refresh(selected.id);
  }

  async function toggleGroup(group: ResourceGroup) {
    setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/resource-groups/${group.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: !group.is_published }) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Guruh holatini o‘zgartirib bo‘lmadi");
    setMessage(group.is_published ? "Guruh nashrdan olindi." : "Guruh kutubxonada nashr qilindi."); await refresh(group.id);
  }

  async function toggleResource(resource: LibraryResource) {
    if (!selected) return; setError(""); setMessage(""); const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/resources/${resource.id}/publish`, { method: "PATCH", headers: { "X-CSRF-Token": token }, body: JSON.stringify({ is_published: !resource.is_published }) });
    const data = (await response.json().catch(() => ({}))) as { detail?: string };
    if (!response.ok) return setError(data.detail ?? "Resurs holatini o‘zgartirib bo‘lmadi");
    setMessage(resource.is_published ? "Resurs nashrdan olindi." : "Resurs nashr qilindi."); await refresh(selected.id);
  }

  async function removeResource(resource: LibraryResource) {
    if (!selected || !window.confirm(`“${resource.title}” resursini o‘chirasizmi?`)) return; const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/resources/${resource.id}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Resursni o‘chirib bo‘lmadi"); setMessage("Resurs o‘chirildi."); await refresh(selected.id);
  }

  async function removeGroup(group: ResourceGroup) {
    if (!window.confirm(`“${group.name}” guruhi va ichidagi barcha resurslarni o‘chirasizmi?`)) return; const token = csrf(); if (!token) return;
    const response = await apiFetch(`/api/v1/admin/resource-groups/${group.id}`, { method: "DELETE", headers: { "X-CSRF-Token": token } });
    if (!response.ok) return setError("Guruhni o‘chirib bo‘lmadi"); setSelected(null); setMessage("Resurs guruhi o‘chirildi."); await refresh();
  }

  function choose(group: ResourceGroup) { setSelected(group); setResourceForm({ ...emptyResource, display_order: group.resources.length + 1 }); setError(""); setMessage(""); }

  return <main className={styles.shell}><header><Link href="/admin"><ArrowLeft /> Admin panel</Link><span><BookOpen weight="fill" />sitlearning</span></header><section className={styles.content}><div className={styles.heading}><div><p>ELEKTRON KUTUBXONA</p><h1>Resurslar boshqaruvi</h1><span>Yo‘nalishlar bo‘yicha guruhlar va elektron materiallar yarating.</span></div><button onClick={() => setShowGroupForm((value) => !value)}><Plus /> Yangi guruh</button></div>{error && <div className={styles.error}><WarningCircle />{error}</div>}{message && <div className={styles.success}><CheckCircle />{message}</div>}{showGroupForm && <form className={styles.groupForm} onSubmit={createGroup}><h2>Yangi resurs guruhi</h2><label>Guruh nomi<input value={groupForm.name} onChange={(event) => { const name = event.target.value; setGroupForm({ ...groupForm, name, slug: slugify(name) }); }} minLength={3} required /></label><label>Yo‘nalish<input value={groupForm.direction} onChange={(event) => setGroupForm({ ...groupForm, direction: event.target.value })} placeholder="Masalan: Boshlang‘ich ta’lim" required /></label><label>Slug<input value={groupForm.slug} onChange={(event) => setGroupForm({ ...groupForm, slug: slugify(event.target.value) })} required /></label><label className={styles.wide}>Tavsif<textarea value={groupForm.description} onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })} minLength={10} required /></label><div className={styles.formActions}><button type="button" onClick={() => setShowGroupForm(false)}>Bekor qilish</button><button type="submit"><Books /> Guruh yaratish</button></div></form>}<div className={styles.layout}><section className={styles.groups}><div className={styles.groupHead}><h2>Guruhlar</h2><b>{groups.length}</b></div>{loading && <div className={styles.empty}>Yuklanmoqda…</div>}{groups.map((group) => <button key={group.id} className={selected?.id === group.id ? styles.selected : ""} onClick={() => choose(group)}><span><Books weight="duotone" /></span><div><strong>{group.name}</strong><small>{group.direction} · {group.resources.length} resurs</small></div><em className={group.is_published ? styles.published : styles.draft}>{group.is_published ? "Nashrda" : "Qoralama"}</em></button>)}{!loading && groups.length === 0 && <div className={styles.empty}>Hali guruh yaratilmagan.</div>}</section><aside className={styles.editor}>{selected ? <><div className={styles.selectedHead}><div><p>{selected.direction.toUpperCase()}</p><h2>{selected.name}</h2><span>{selected.description}</span></div><div><button onClick={() => void toggleGroup(selected)}>{selected.is_published ? "Nashrdan olish" : <><RocketLaunch /> Guruhni nashr qilish</>}</button><button onClick={() => void removeGroup(selected)} aria-label="Guruhni o‘chirish"><Trash /></button></div></div><div className={styles.addColumns}><form onSubmit={addFile}><h3><FileArrowUp /> Fayl yuklash</h3><ResourceFields form={resourceForm} setForm={setResourceForm} /><label>Fayl<input type="file" accept=".pdf,.docx,.pptx,.xlsx" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} required /></label><button type="submit"><FileArrowUp /> Xavfsiz yuklash</button><small>PDF, Word, PowerPoint yoki Excel — 50 MB gacha.</small></form><form onSubmit={addLink}><h3><LinkSimple /> Tashqi havola</h3><ResourceFields form={resourceForm} setForm={setResourceForm} /><label>HTTPS havola<input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." required /></label><button type="submit"><LinkSimple /> Havolani qo‘shish</button></form></div><section className={styles.resources}><h3>Guruh resurslari <small>{selected.resources.length}</small></h3>{selected.resources.map((resource) => <article key={resource.id}><span>{resource.original_filename ? <FileText weight="duotone" /> : <LinkSimple weight="duotone" />}</span><div><b>{resource.title}</b><small>{typeNames[resource.resource_type]}{resource.original_filename ? ` · ${resource.original_filename}` : " · tashqi havola"}</small></div><em className={resource.is_published ? styles.published : styles.draft}>{resource.is_published ? "Nashrda" : "Qoralama"}</em><a href={fileUrl(resource.url)} target="_blank" rel="noreferrer">Ochish</a><button onClick={() => void toggleResource(resource)}>{resource.is_published ? "Yopish" : "Nashr"}</button><button onClick={() => void removeResource(resource)} aria-label="Resursni o‘chirish"><Trash /></button></article>)}{selected.resources.length === 0 && <div className={styles.empty}>Bu guruhda hali resurs yo‘q.</div>}</section></> : <div className={styles.emptyEditor}><Books weight="duotone" /><h2>Guruhni tanlang</h2><p>Resurs qo‘shish va nashr qilish uchun chap tomondan guruhni tanlang.</p></div>}</aside></div></section></main>;
}

function ResourceFields({ form, setForm }: { form: typeof emptyResource; setForm: (value: typeof emptyResource) => void }) {
  return <><label>Nomi<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} minLength={3} required /></label><label>Turi<select value={form.resource_type} onChange={(event) => setForm({ ...form, resource_type: event.target.value as LibraryResourceType })}>{Object.entries(typeNames).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Tartib<input type="number" min="1" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: Number(event.target.value) })} /></label><label>Tavsif<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></>;
}
