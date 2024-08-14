export default function ShortAddress({address}:{address:string}) {
  return (
    <>
      <span>{address.slice(0,10)}...{address.slice(-10)}</span>
    </>
  );
}