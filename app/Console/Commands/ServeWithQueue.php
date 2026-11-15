<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

#[Signature('serve:with-queue')]
#[Description('Start the Laravel development server and queue worker together')]
class ServeWithQueue extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting Laravel development server and queue worker...');

        $serve = Process::fromShellCommandline('php artisan serve');
        $queue = Process::fromShellCommandline('php artisan queue:work');

        $serve->start(function ($type, $buffer): void {
            $this->output->write($buffer);
        });
        $queue->start(function ($type, $buffer): void {
            $this->output->write($buffer);
        });

        $this->info('Both processes are running. Press CTRL+C to stop.');

        while ($serve->isRunning() || $queue->isRunning()) {
            usleep(200000);

            if (! $serve->isRunning() && $queue->isRunning()) {
                $this->warn('Development server stopped. Stopping queue worker...');
                $queue->stop();
            }

            if (! $queue->isRunning() && $serve->isRunning()) {
                $this->warn('Queue worker stopped. Stopping development server...');
                $serve->stop();
            }
        }

        return Command::SUCCESS;
    }
}
