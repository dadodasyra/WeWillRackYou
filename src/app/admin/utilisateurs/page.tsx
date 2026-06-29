"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type UserRow = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/users");
    if (response.ok) setUsers(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    setUsername("");
    setPassword("");
    setRole("USER");
    load();
  }

  async function handleUpdate(user: UserRow) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        role: user.role,
        ...(editPassword ? { password: editPassword } : {}),
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    setEditingId(null);
    setEditPassword("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Erreur");
      return;
    }
    load();
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Utilisateurs</h1>
        <p className="text-sm text-stone-600">Gestion des comptes</p>
        <Link href="/admin/archives" className="text-sm text-emerald-700">
          Voir les archives →
        </Link>
      </header>

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold">Ajouter un utilisateur</h2>
        <Input label="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Select
          label="Rôle"
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
          options={[
            { value: "USER", label: "Utilisateur" },
            { value: "ADMIN", label: "Administrateur" },
          ]}
        />
        <Button type="submit">Ajouter</Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-3">
        {users.map((user) => (
          <li key={user.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            {editingId === user.id ? (
              <div className="space-y-2">
                <Input
                  label="Nom d'utilisateur"
                  value={user.username}
                  onChange={(e) =>
                    setUsers((list) =>
                      list.map((u) =>
                        u.id === user.id ? { ...u, username: e.target.value } : u,
                      ),
                    )
                  }
                />
                <Select
                  label="Rôle"
                  value={user.role}
                  onChange={(e) =>
                    setUsers((list) =>
                      list.map((u) =>
                        u.id === user.id
                          ? { ...u, role: e.target.value as "ADMIN" | "USER" }
                          : u,
                      ),
                    )
                  }
                  options={[
                    { value: "USER", label: "Utilisateur" },
                    { value: "ADMIN", label: "Administrateur" },
                  ]}
                />
                <Input
                  label="Nouveau mot de passe (optionnel)"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(user)}>Enregistrer</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-stone-500">
                    {user.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="!w-auto px-3" onClick={() => setEditingId(user.id)}>
                    Modifier
                  </Button>
                  <Button variant="danger" className="!w-auto px-3" onClick={() => handleDelete(user.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
