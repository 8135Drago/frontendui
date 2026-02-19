import React, { useEffect, useState } from "react";

export default function AdminUserManagement({ authHeaders }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/admin/users", { headers: authHeaders })
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const updateUser = async (user) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
  };

  return (
    <div>
      {users.map(u => (
        <div key={u.id} style={{ marginBottom: 20 }}>
          <input value={u.username} onChange={e => u.username = e.target.value} />
          <input value={u.role} onChange={e => u.role = e.target.value} />
          <input value={u.verified} onChange={e => u.verified = e.target.value} />
          <input value={u.validcommands || ""} onChange={e => u.validcommands = e.target.value} placeholder="ls,echo,grep" />
          <button onClick={() => updateUser(u)}>Save</button>
        </div>
      ))}
    </div>
  );
}
