export default async function MyTeamPage() {
  const MyTeamClient = (await import("./my-team-client")).default
  return <MyTeamClient />
}
