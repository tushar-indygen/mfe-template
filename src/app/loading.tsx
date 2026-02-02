export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
    </div>
  )
}
