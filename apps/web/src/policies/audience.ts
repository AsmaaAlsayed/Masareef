/**
 * Who is shown the policy change notice. FR-039 criterion 4 names "a signed-in user". There is no
 * sign-in in the web app yet, so for now every visitor whose device saw an earlier version is shown
 * it: the notice, its storage and its tests do not change when this does.
 *
 * The task that gives the web app a session (T-022 and the screens that use it) replaces the body
 * with "a session exists", for example `return useSession().data !== null`, so that only signed-in
 * users are shown the notice and visitors leave nothing in storage. It should also give a device
 * with nothing stored the account's accepted terms version from `GET /me` as its starting point
 * (see PolicyNotice.tsx), so a user signing in on a new device still hears of a change made since
 * they accepted.
 */
export function usePolicyNoticeAudience(): boolean {
  return true;
}
