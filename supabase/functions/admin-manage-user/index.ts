import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claims.claims.sub as string;

    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── LIST USERS ──
    if (action === "list") {
      const { data: users, error: listErr } = await adminClient.auth.admin.listUsers();
      if (listErr) throw listErr;

      // Get profiles and roles
      const { data: profiles } = await adminClient.from("profiles").select("id, full_name, phone, cargo");
      const { data: roles } = await adminClient.from("user_roles").select("user_id, role");

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

      const result = (users?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: profileMap.get(u.id)?.full_name || "",
        cargo: profileMap.get(u.id)?.cargo || "",
        phone: profileMap.get(u.id)?.phone || "",
        role: roleMap.get(u.id) || "user",
        created_at: u.created_at,
        banned_until: u.banned_until,
      }));

      return new Response(JSON.stringify({ users: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, password: pwd, email: em, full_name, cargo, role } = body;

    // ── CREATE USER ──
    if (action === "create" && em && pwd) {
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: em,
        password: pwd,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });
      if (createErr) throw createErr;

      // Update profile with name and cargo
      if (full_name || cargo) {
        await adminClient.from("profiles").update({
          full_name: full_name || "",
          cargo: cargo || null,
        }).eq("id", newUser.user.id);
      }

      // Assign role
      const assignRole = role || "admin";
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: assignRole });
      if (roleErr) throw roleErr;

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id, message: "Usuário criado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE USER ──
    if (action === "update" && userId) {
      const updates: any = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (cargo !== undefined) updates.cargo = cargo;

      if (Object.keys(updates).length > 0) {
        await adminClient.from("profiles").update(updates).eq("id", userId);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Usuário atualizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── RESET PASSWORD ──
    if (action === "reset_password" && userId) {
      const { data: userData, error: userErr } =
        await adminClient.auth.admin.getUserById(userId);
      if (userErr || !userData?.user?.email) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (pwd) {
        const { error } = await adminClient.auth.admin.updateUserById(userId, { password: pwd });
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: "Senha atualizada" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        const { error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: userData.user.email,
        });
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: "Email de recuperação enviado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── DISABLE ──
    if (action === "disable" && userId) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "876600h",
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Conta desativada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ENABLE ──
    if (action === "enable" && userId) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: "none",
      });
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Conta reativada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── DELETE ──
    if (action === "delete" && userId) {
      if (userId === callerId) {
        return new Response(
          JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true, message: "Usuário excluído" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});