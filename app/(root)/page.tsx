import RecentTransactions from "@/components/RecentTransactions"
import RightNavBar from "@/components/RightNavBar"
import HeaderBox from "@/components/headerBox"
import TotalBalanceBox from "@/components/totalBalanceBox"
import { getAccount, getAccounts } from "@/lib/actions/bank.actions"
import { getLoggedInUser } from "@/lib/actions/user.actions"
const Home = async ({searchParams:{id,page}}:SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({userId:loggedIn.$id})
  if(!accounts) return;
  const appwriteItemId = (id as string) || accounts?.data[0]?.appwriteItemId;
  const account = await getAccount({appwriteItemId});
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
                 accounts={accounts?.data}
                 totalBanks={accounts?.totalBanks}
                 totalCurrentBalance={accounts?.totalCurrentBalance}
                 />
          </header>
          <RecentTransactions accounts={accounts?.data} transactions={account?.transactions} appwriteItemId = {appwriteItemId} page = {currentPage}/>
        </div>
      <RightNavBar user={loggedIn} transactions={account?.transactions} banks={accounts?.data?.slice(0,2)}/>
      </section>
    </div>
  )
}

export default Home
