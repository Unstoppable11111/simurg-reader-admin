export function useAuthwork() {
  const queryWorkList = (data) => {
    console.log("查询作品列表", data);
  }
  return {
    queryWorkList
  }
}