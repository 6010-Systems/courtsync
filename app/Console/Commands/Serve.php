<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Signature;
use Illuminate\Foundation\Console\ServeCommand as BaseServeCommand;
use Symfony\Component\Process\Process;

#[Signature('serve {--host= : The hostname to serve on} {--port= : The port to serve on} {--no-reload : Disable automatic reloading}')]
class Serve extends BaseServeCommand
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting queue worker...');

        $queue = Process::fromShellCommandline('php artisan queue:work');
        $queue->start(function ($type, $buffer): void {
            $this->output->write($buffer);
        });

        $this->info('Queue worker started.');

        try {
            return parent::handle();
        } finally {
            if ($queue->isRunning()) {
                $this->info('Stopping queue worker...');
                $queue->stop();
            }
        }
    }
}
