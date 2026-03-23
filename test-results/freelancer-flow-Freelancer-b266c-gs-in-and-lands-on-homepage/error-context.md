# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - link "Glaze Glaze" [ref=e4] [cursor=pointer]:
      - /url: /
      - img "Glaze" [ref=e5]
      - generic [ref=e6]: Glaze
    - generic [ref=e7]:
      - generic [ref=e8]:
        - heading "Welcome back" [level=3] [ref=e9]
        - paragraph [ref=e10]: Sign in to your Glaze account
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]:
            - text: Email
            - textbox "Email" [ref=e14]:
              - /placeholder: you@example.com
              - text: test-freelancer@glaze.test
          - generic [ref=e15]:
            - text: Password
            - textbox "Password" [ref=e16]: testpass123
          - paragraph [ref=e17]: Invalid email or password.
          - button "Sign in" [ref=e18] [cursor=pointer]
        - paragraph [ref=e19]:
          - text: Don't have an account?
          - link "Sign up" [ref=e20] [cursor=pointer]:
            - /url: /signup
```