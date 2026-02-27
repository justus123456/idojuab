// Sticky header on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const icon = document.getElementById('log');
    const log = document.getElementById('logout');

    if (header) {
        header.classList.toggle('sticky', window.scrollY > 0);
    }

    if (window.scrollY > 0) {
        if (log) log.style.display = 'none';
        if (icon) icon.style.display = 'block';
    } else {
        if (log) log.style.display = 'block';
        if (icon) icon.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const client = window.supabaseClient;
    if (!client) {
        console.error('Supabase client not available.');
        return;
    }

    async function checkAuthentication() {
        const { data, error } = await client.auth.getSession();
        if (error || !data?.session) {
            window.location.href = '/login.html';
        }
    }

    function renderPriceList(prices, tableBodyClass, gender) {
        const result = document.querySelector(tableBodyClass);
        if (!result) {
            console.error('Table body not found for class:', tableBodyClass);
            return;
        }

        const filteredPrices = prices.filter((item) => item.gender === gender);
        result.innerHTML = filteredPrices.length > 0
            ? filteredPrices.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.cloth_type ?? item.clothType ?? 'N/A'}</td>
                    <td><span id="line">N</span> ${item.ironing_price ?? item.ironingPrice ?? 'N/A'}</td>
                    <td><span id="line">N</span> ${item.washing_price ?? item.washingPrice ?? 'N/A'}</td>
                    <td>${item.gender}</td>
                    <td><button class="delete" data-id="${item.id}" data-gender="${gender}">Delete</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="6">No items found.</td></tr>';
    }

    async function fetchPrices() {
        const { data, error } = await client.from('prices').select('*').order('id', { ascending: true });
        if (error) {
            console.error('Error fetching prices:', error);
            return;
        }

        renderPriceList(data || [], '.dat', 'Male');
        renderPriceList(data || [], '.dats', 'Female');
    }

    function renderMessageList(messages) {
        const result = document.querySelector('.datam');
        if (!result) {
            console.error('Table body not found for messages');
            return;
        }

        result.innerHTML = messages.length > 0
            ? messages.map((message) => `
                <tr>
                    <td>${message.name}</td>
                    <td>${message.email}</td>
                    <td>${message.message}</td>
                    <td>${message.created_at ? new Date(message.created_at).toLocaleString() : '-'}</td>
                    <td><button class="delete-message" data-id="${message.id}">Delete</button></td>
                </tr>
            `).join('')
            : '<tr><td colspan="5">No messages found.</td></tr>';
    }

    async function fetchMessages() {
        const { data, error } = await client.from('messages').select('*').order('id', { ascending: false });
        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        renderMessageList(data || []);
    }

    const maleForm = document.getElementById('important-form');
    const femaleForm = document.getElementById('important');

    if (maleForm) {
        maleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clothType = document.getElementById('idk').value.trim();
            const ironingPrice = document.getElementById('price-ironing').value.trim();
            const washingPrice = document.getElementById('price-washing').value.trim();
            const isMale = document.getElementById('male').checked;

            if (!clothType || !ironingPrice || !washingPrice || !isMale) return;

            const { error } = await client.from('prices').insert({
                cloth_type: clothType,
                ironing_price: ironingPrice,
                washing_price: washingPrice,
                gender: 'Male',
            });

            if (error) {
                console.error('Error adding male price:', error);
                return;
            }

            maleForm.reset();
            fetchPrices();
        });
    }

    if (femaleForm) {
        femaleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clothType = document.getElementById('idkk').value.trim();
            const ironingPrice = document.getElementById('ironing').value.trim();
            const washingPrice = document.getElementById('washing').value.trim();
            const isFemale = document.getElementById('females').checked;

            if (!clothType || !ironingPrice || !washingPrice || !isFemale) return;

            const { error } = await client.from('prices').insert({
                cloth_type: clothType,
                ironing_price: ironingPrice,
                washing_price: washingPrice,
                gender: 'Female',
            });

            if (error) {
                console.error('Error adding female price:', error);
                return;
            }

            femaleForm.reset();
            fetchPrices();
        });
    }

    const clearMaleButton = document.getElementById('clear');
    const clearFemaleButton = document.getElementById('dear');
    const clearMessagesButton = document.getElementById('delete');

    if (clearMaleButton) {
        clearMaleButton.addEventListener('click', async () => {
            const { error } = await client.from('prices').delete().eq('gender', 'Male');
            if (error) {
                console.error('Error clearing male prices:', error);
                return;
            }
            renderPriceList([], '.dat', 'Male');
        });
    }

    if (clearFemaleButton) {
        clearFemaleButton.addEventListener('click', async () => {
            const { error } = await client.from('prices').delete().eq('gender', 'Female');
            if (error) {
                console.error('Error clearing female prices:', error);
                return;
            }
            renderPriceList([], '.dats', 'Female');
        });
    }

    if (clearMessagesButton) {
        clearMessagesButton.addEventListener('click', async () => {
            const { error } = await client.from('messages').delete().gt('id', 0);
            if (error) {
                console.error('Error clearing messages:', error);
                return;
            }
            renderMessageList([]);
        });
    }

    const maleTable = document.querySelector('.dat');
    if (maleTable) {
        maleTable.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete') && e.target.dataset.gender === 'Male') {
                const id = Number(e.target.dataset.id);
                const { error } = await client.from('prices').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting male price:', error);
                    return;
                }
                fetchPrices();
            }
        });
    }

    const femaleTable = document.querySelector('.dats');
    if (femaleTable) {
        femaleTable.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete') && e.target.dataset.gender === 'Female') {
                const id = Number(e.target.dataset.id);
                const { error } = await client.from('prices').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting female price:', error);
                    return;
                }
                fetchPrices();
            }
        });
    }

    const messagesTable = document.querySelector('.datam');
    if (messagesTable) {
        messagesTable.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-message')) {
                const id = Number(e.target.dataset.id);
                const { error } = await client.from('messages').delete().eq('id', id);
                if (error) {
                    console.error('Error deleting message:', error);
                    return;
                }
                fetchMessages();
            }
        });
    }

    const logoutButtons = document.querySelectorAll('#logout, #log');
    logoutButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            await client.auth.signOut();
            window.location.href = 'login.html';
        });
    });

    await checkAuthentication();
    fetchPrices();
    fetchMessages();
    setInterval(fetchPrices, 5000);
});
