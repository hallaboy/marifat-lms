"use client";

import { ArrowLeft, BookOpen, Books, DownloadSimple, FileText, LinkSimple, MagnifyingGlass, PresentationChart, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { API_ORIGIN, apiFetch, AuthUser, LibraryResource, ResourceGroup } from "../_lib/api";
import styles from "./styles.module.css";

const typeNames = { textbook: "Darslik", methodology: "Metodik qo‘llanma", recommendation: "Tavsiya", presentation: "Taqdimot", other: "Boshqa" };
const fileUrl = (url: string) => url.startsWith("/") ? `${API_ORIGIN}${url}` : url;

export default function ResourcesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profileResponse = await apiFetch("/api/v1/auth/me");
        if (profileResponse.status === 401) return router.replace("/login");
        if (!profileResponse.ok) throw new Error("Profilni yuklab bo‘lmadi");
        setUser((await profileResponse.json()) as AuthUser);
        const response = await apiFetch("/api/v1/resources");
        if (!response.ok) throw new Error("Resurslarni yuklab bo‘lmadi");
        setGroups((await response.json()) as ResourceGroup[]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Server bilan aloqa uzildi");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const directions = useMemo(() => [...new Set(groups.map((group) => group.direction))], [groups]);
  const filtered = useMemo(() => groups.map((group) => ({ ...group, resources: group.resources.filter((resource) => `${resource.title} ${resource.description ?? ""} ${typeNames[resource.resource_type]}`.toLocaleLowerCase("uz").includes(query.toLocaleLowerCase("uz"))) })).filter((group) => (direction === "all" || group.direction === direction) && (`${group.name} ${group.direction} ${group.description}`.toLocaleLowerCase("uz").includes(query.toLocaleLowerCase("uz")) || group.resources.length > 0)), [groups, query, direction]);

  function icon(resource: LibraryResource) {
    if (resource.resource_type === "presentation") return PresentationChart;
    if (resource.original_filename) return FileText;
    return LinkSimple;
  }

  const backHref = user?.role === "admin" || user?.role === "super_admin" ? "/admin" : "/my-courses";
  return <main className={styles.shell}><header><Link href="/" className={styles.brand}><BookOpen weight="fill" />sitlearning</Link><span>{user?.full_name}</span></header><section className={styles.hero}><Link href={backHref}><ArrowLeft /> Kabinetga qaytish</Link><p>ELEKTRON KUTUBXONA</p><h1>Resurslar</h1><span>Darsliklar, metodik qo‘llanmalar va foydali tavsiyalar.</span><Books weight="duotone" /></section><section className={styles.content}><div className={styles.filters}><label><MagnifyingGlass /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Resurslarni qidiring..." /></label><select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="all">Barcha yo‘nalishlar</option>{directions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>{loading && <div className={styles.state}>Kutubxona yuklanmoqda…</div>}{error && <div className={`${styles.state} ${styles.error}`}><WarningCircle />{error}</div>}{!loading && !error && <div className={styles.library}>{filtered.map((group) => <section className={styles.group} key={group.id}><header><span><Books weight="duotone" /></span><div><p>{group.direction}</p><h2>{group.name}</h2><small>{group.description}</small></div><b>{group.resources.length} resurs</b></header><div className={styles.grid}>{group.resources.map((resource) => { const Icon = icon(resource); return <article key={resource.id}><span><Icon weight="duotone" /></span><div><small>{typeNames[resource.resource_type]}</small><h3>{resource.title}</h3><p>{resource.description ?? "Elektron ta’lim resursi"}</p>{resource.original_filename && <em>{resource.original_filename}{resource.size_bytes ? ` · ${(resource.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}</em>}</div><a href={fileUrl(resource.url)} target="_blank" rel="noreferrer">{resource.original_filename ? <><DownloadSimple /> Yuklab olish</> : <><LinkSimple /> Ochish</>}</a></article>})}{group.resources.length === 0 && <div className={styles.emptyGroup}>Ushbu guruhda mos resurs topilmadi.</div>}</div></section>)}{filtered.length === 0 && <div className={styles.empty}><MagnifyingGlass /><h2>Resurs topilmadi</h2><p>Qidiruv so‘zini yoki yo‘nalishni o‘zgartirib ko‘ring.</p></div>}</div>}</section></main>;
}
