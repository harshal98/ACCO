import { CircularProgress, CircularProgressLabel } from "@chakra-ui/react";
import { useEffect, useState } from "react";

function Timer(props: { count: number }) {
  if (props.count > 0) {
  }
  let [c, setc] = useState(0);
  useEffect(() => {
    let t = setInterval(() => {
      setc((c) => c + 1);
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, []);
  useEffect(() => setc(0), [props.count]);
  return (
    // Change the size to 120px
    <>
      <CircularProgress value={(c / 30) * 100} color="green.400" size="80px">
        <CircularProgressLabel>{c}</CircularProgressLabel>
      </CircularProgress>
    </>
    // <CircularProgress value={(c / 30) * 100} size="120px" />
  );
}

export default Timer;
