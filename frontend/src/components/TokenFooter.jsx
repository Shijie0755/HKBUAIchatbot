export default function TokenFooter({ model, tokens }) {
  const total = (tokens.in + tokens.out).toLocaleString()
  return (
    <div className="token-footer">
      {model}&nbsp;·&nbsp;Session usage: {total} tokens
    </div>
  )
}
