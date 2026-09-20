# 08 — Deploy

**What to build:** The index, in the kitchen. This is the ticket that makes Phase 1 real: everything before it works on the machine it was built on, which is not where cooking happens.

Deploy the static build to a host your phone can reach, with the project credentials configured there. Then use it the way you actually would — pick a category, find something to make, follow it to the blog.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] The static build is deployed to a host reachable from a phone
- [ ] Supabase credentials are configured in the host's environment, not committed
- [ ] Logging in works on a phone, and the session persists between visits
- [ ] Filtering by Category, searching, and sorting all work on a phone
- [ ] Tapping a recipe opens the page that holds it
- [ ] The whole collection loads in a reasonable time on a mobile connection
- [ ] How to redeploy is written down somewhere you will find it again
