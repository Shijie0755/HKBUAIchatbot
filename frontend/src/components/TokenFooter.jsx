export default function TokenFooter({ model, tokens }) {
  const total = (tokens.in + tokens.out).toLocaleString()
  return (
    <div className="token-footer">
      {model} is AI and can make mistakes&nbsp;·&nbsp;Session usage: {total} tokens
      <div className="token-footer-copyright">Copyright © 2026 ShiJie0755</div>
      <div className="token-footer-copyright">contact: 25284053@life.hkbu.edu.hk</div>
    </div>
  )
}
