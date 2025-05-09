export const enhanceCode = (el: HTMLElement) => {
  const preTagList = el.getElementsByTagName('pre')
  for (const pre of preTagList) {
    const code = pre.querySelector('code')
    const enhance = pre.querySelector('.enhance')
    if (!enhance) return
    const lang = enhance.querySelector('.lang')
    const copyCode = enhance.querySelector('.copyCode')
    const firstDiv = code?.firstElementChild as HTMLElement
    if (lang) {
      let langTxt = firstDiv?.getAttribute('lang') as string
      // langTxt = langTxt.charAt(0).toUpperCase() + langTxt.slice(1)
      lang.innerHTML = langTxt
    }
    if (copyCode) {
      if (!copyCode.getAttribute('onclick')) {
        copyCode.setAttribute('onclick', 'true')
        copyCode.addEventListener('click', () => {
          if (firstDiv) {
            navigator.clipboard.writeText(firstDiv.innerText).then(() => {
              window.$message.success('复制成功');
            }).catch(err => {
              console.error('复制失败:', err);
            });
          }
        })
      }
    }
  }
}