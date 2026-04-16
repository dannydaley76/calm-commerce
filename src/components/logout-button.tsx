export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="inline-flex items-center justify-center rounded-lg border border-[rgba(84,90,149,0.25)] bg-transparent px-6 py-3 text-sm font-medium text-[#545a95] transition hover:bg-[#ffffff]">
        Log out
      </button>
    </form>
  );
}
