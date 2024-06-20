import RightNavBar from "@/components/RightNavBar"
import HeaderBox from "@/components/headerBox"
import TotalBalanceBox from "@/components/totalBalanceBox"
const Home = () => {
  const loggedIn = {
    firstName : "Master",
    lastName : "Crest",
    email : "someone@gmail.com"
  }
  return (
    <div>
      <section className='home'>
        <div className='home-content'>
          <header className='home-header'>
                 <HeaderBox 
                 type="greeting"
                 title="Welcome"
                 user={loggedIn?.firstName || "Guest"}
                 subtext="Access and manage your account and transactions efficiently"
                 />
                 <TotalBalanceBox 
                 accounts={[]}
                 totalBanks={1}
                 totalCurrentBalance={1250.35}
                 />
          </header>
          RECENT TRANSACTIONS
        </div>
      <RightNavBar user={loggedIn} transactions={[]} banks={[{currentBalance:125.50},{currentBalance:500}]}/>
      </section>
    </div>
  )
}

export default Home
